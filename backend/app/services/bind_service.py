import re
import datetime
from typing import List, Dict, Any, Tuple
from app.schemas.export_import import ParsedRecordPreview

def parse_bind_zone(zone_text: str, default_origin: str = "example.com.") -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses a BIND 9 zone file text into a list of DNS record dictionaries.
    Supports $ORIGIN, $TTL, standard record types (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA),
    comments (;), multi-line records in parentheses, and relative vs FQDN names.
    """
    records: List[Dict[str, Any]] = []
    errors: List[str] = []

    if not default_origin.endswith("."):
        default_origin = f"{default_origin}."

    current_origin = default_origin
    current_ttl = 300

    # Clean multi-line records enclosed in parentheses into single logical lines
    cleaned_lines = []
    in_multiline = False
    buffer = ""

    for raw_line in zone_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith(";"):
            continue

        # Strip inline comments (outside quotes)
        # Simple heuristic: remove ; unless in quotes
        quote_open = False
        clean_chars = []
        for ch in line:
            if ch == '"':
                quote_open = not quote_open
            if ch == ';' and not quote_open:
                break
            clean_chars.append(ch)
        line = "".join(clean_chars).strip()
        if not line:
            continue

        if "(" in line and ")" not in line:
            in_multiline = True
            buffer += " " + line.replace("(", " ")
            continue
        elif in_multiline:
            if ")" in line:
                in_multiline = False
                buffer += " " + line.replace(")", " ")
                cleaned_lines.append(" ".join(buffer.split()))
                buffer = ""
            else:
                buffer += " " + line
                continue
        else:
            cleaned_lines.append(line)

    last_record_name = "@"

    for line_num, line in enumerate(cleaned_lines, start=1):
        try:
            tokens = line.split()
            if not tokens:
                continue

            first_token = tokens[0].upper()

            # Handle directives
            if first_token == "$ORIGIN":
                if len(tokens) >= 2:
                    val = tokens[1]
                    if not val.endswith("."):
                        val = f"{val}."
                    current_origin = val
                continue

            if first_token == "$TTL":
                if len(tokens) >= 2:
                    try:
                        current_ttl = parse_ttl_string(tokens[1])
                    except Exception:
                        pass
                continue

            # Standard line parsing
            # Format could be:
            # [name] [ttl] [class] type rdata...
            # [name] [class] [ttl] type rdata...
            # [name] type rdata...
            # [ttl] [class] type rdata... (inherits previous name)
            # type rdata... (inherits previous name)

            idx = 0
            name = None
            ttl = current_ttl
            rec_type = None

            KNOWN_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}

            # Check if first token is a known type (means name was omitted)
            if tokens[0].upper() in KNOWN_TYPES:
                name = last_record_name
                rec_type = tokens[0].upper()
                idx = 1
            else:
                name = tokens[0]
                idx = 1
                last_record_name = name

                # Check if next token is TTL or IN
                if idx < len(tokens):
                    if tokens[idx].isdigit() or (len(tokens[idx]) > 1 and tokens[idx][:-1].isdigit() and tokens[idx][-1].lower() in ['s', 'm', 'h', 'd', 'w']):
                        ttl = parse_ttl_string(tokens[idx])
                        idx += 1

                if idx < len(tokens) and tokens[idx].upper() == "IN":
                    idx += 1

                if idx < len(tokens):
                    if tokens[idx].isdigit() or (len(tokens[idx]) > 1 and tokens[idx][:-1].isdigit() and tokens[idx][-1].lower() in ['s', 'm', 'h', 'd', 'w']):
                        ttl = parse_ttl_string(tokens[idx])
                        idx += 1

                if idx < len(tokens) and tokens[idx].upper() in KNOWN_TYPES:
                    rec_type = tokens[idx].upper()
                    idx += 1
                else:
                    errors.append(f"Line {line_num}: Unrecognized record type in '{line}'")
                    continue

            # Normalize name
            if name == "@":
                fqdn_name = current_origin
            elif name.endswith("."):
                fqdn_name = name
            else:
                fqdn_name = f"{name}.{current_origin}"

            rdata_tokens = tokens[idx:]
            rdata_str = " ".join(rdata_tokens)

            # Special parsing for TXT
            if rec_type == "TXT":
                # Extract quoted strings or wrap raw text
                txt_matches = re.findall(r'"([^"]*)"', rdata_str)
                if txt_matches:
                    values = txt_matches
                else:
                    values = [rdata_str.strip('"')]
            elif rec_type == "MX":
                # MX priority + mail server
                values = [rdata_str]
            else:
                values = [rdata_str]

            # Merge with existing record of same name and type if simple list
            found = False
            for existing in records:
                if existing["name"] == fqdn_name and existing["type"] == rec_type:
                    for v in values:
                        if v not in existing["values"]:
                            existing["values"].append(v)
                    found = True
                    break

            if not found:
                records.append({
                    "name": fqdn_name,
                    "type": rec_type,
                    "ttl": ttl,
                    "values": values,
                    "routing_policy": "SIMPLE",
                    "routing_config": {},
                    "is_alias": False,
                    "alias_target": None
                })

        except Exception as e:
            errors.append(f"Line {line_num}: Failed to parse ({str(e)})")

    return records, errors

def parse_ttl_string(ttl_str: str) -> int:
    s = ttl_str.lower().strip()
    if s.isdigit():
        return int(s)
    unit = s[-1]
    val = int(s[:-1])
    multipliers = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800}
    return val * multipliers.get(unit, 1)

def export_to_bind_format(zone_name: str, records: List[Dict[str, Any]]) -> str:
    """
    Exports records list to standard BIND 9 RFC 1035 zone file format.
    """
    lines = [
        f"; BIND Zone File for {zone_name}",
        f"; Exported from AWS Route53 Clone on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"$ORIGIN {zone_name}",
        f"$TTL 300",
        ""
    ]

    for rec in records:
        name = rec.get("name", zone_name)
        rec_type = rec.get("type", "A")
        ttl = rec.get("ttl", 300)
        values = rec.get("values", [])

        for val in values:
            if rec_type == "TXT":
                formatted_val = f'"{val.strip(chr(34))}"'
            else:
                formatted_val = str(val)

            lines.append(f"{name:<30} {ttl:<6} IN  {rec_type:<6} {formatted_val}")

    return "\n".join(lines) + "\n"

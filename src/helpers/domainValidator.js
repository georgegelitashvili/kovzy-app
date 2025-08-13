export function domainValidator(domain)
{
    const re = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domain) return "domain can't be empty."
    if (!re.test(domain)) return 'Valid domain address: \n "example.com or example.kovzy.com"'
    return ''
}
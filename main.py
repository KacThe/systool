from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from concurrent.futures import ThreadPoolExecutor
import ipaddress
import re
import shlex

try:
    import paramiko
except Exception:
    paramiko = None

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

_IPV4_RE = re.compile(
    r"^(25[0-5]|2[0-4]\d|1?\d?\d)"
    r"(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$"
)
_HOST_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\-\.]{0,253}[A-Za-z0-9]$")
_HTTP_URL_RE = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)
_HTTP_METHOD_RE = re.compile(r"^[A-Z]{3,10}$")
_DOCKER_CONTAINER_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$")
_SYSTEMD_SERVICE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.@:-]{0,127}$")


def _is_ipv4(value: str) -> bool:
    return bool(_IPV4_RE.match(value.strip()))


def _is_host_or_ipv4(value: str) -> bool:
    value = value.strip()
    return bool(_IPV4_RE.match(value)) or bool(_HOST_RE.match(value))


def _is_http_url(value: str) -> bool:
    return bool(_HTTP_URL_RE.match(value.strip()))


def _is_http_method(value: str) -> bool:
    return bool(_HTTP_METHOD_RE.match(value.strip().upper()))


def _is_docker_container_name(value: str) -> bool:
    return bool(_DOCKER_CONTAINER_RE.match(value.strip()))


def _is_systemd_service_name(value: str) -> bool:
    return bool(_SYSTEMD_SERVICE_RE.match(value.strip()))


def _redact_secret(text: str, secret: str) -> str:
    if not secret:
        return text
    return text.replace(secret, "[REDACTED]")


def _strip_redacted_echo_lines(text: str) -> str:
    lines = text.splitlines()
    kept = [line for line in lines if line.strip() != "[REDACTED]"]
    return "\n".join(kept)


def _run_remote_command(host: str, user: str, password: str, cmd: str, use_sudo: bool = False) -> str:
    if paramiko is None:
        return "Error: paramiko is not installed. Install it with: pip install paramiko"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    remote_cmd = cmd
    if use_sudo:
        remote_cmd = f"sudo -S -p '' sh -c {shlex.quote(cmd)}"
    try:
        client.connect(
            hostname=host,
            username=user,
            password=password,
            timeout=5,
            auth_timeout=5,
            banner_timeout=5,
        )
        stdin, stdout, stderr = client.exec_command(
            remote_cmd,
            timeout=10,
            get_pty=use_sudo,
        )
        if use_sudo:
            stdin.write(password + "\n")
            stdin.flush()
        out = stdout.read().decode(errors="replace")
        err = stderr.read().decode(errors="replace")
        rc = stdout.channel.recv_exit_status()
    except Exception as e:
        return f"Error: {e}"
    finally:
        try:
            client.close()
        except Exception:
            pass

    # Protect credentials if remote PTY echoes stdin while using sudo.
    out = _redact_secret(out, password)
    err = _redact_secret(err, password)
    out = _strip_redacted_echo_lines(out)
    err = _strip_redacted_echo_lines(err)

    if err:
        return f"{out}\n{err}\n(exit {rc})".strip()
    return f"{out}\n(exit {rc})".strip()


def _ipv4_to_int(value: str) -> int:
    return int(ipaddress.IPv4Address(value))


def _format_fping_output(raw: str, start_ip: str, end_ip: str) -> str:
    lines = raw.splitlines()
    alive = []
    for line in lines:
        candidate = line.strip()
        if _is_ipv4(candidate):
            alive.append(candidate)

    if not alive:
        return f"No responsive hosts in range {start_ip} - {end_ip}."

    alive_sorted = sorted(set(alive), key=_ipv4_to_int)
    formatted = [
        f"Alive hosts in range {start_ip} - {end_ip}: {len(alive_sorted)}",
        "",
    ]
    formatted.extend(f"{idx}. {host}" for idx, host in enumerate(alive_sorted, start=1))
    return "\n".join(formatted)


@app.get("/", response_class=HTMLResponse)
def form(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "result": "",
            "result_blocks": [],
            "ip": "",
            "ip2": "",
            "ip3": "",
            "ip4": "",
            "ip5": "",
            "ip6": "",
            "ip7": "",
            "ip8": "",
            "ip9": "",
            "ip10": "",
            "machine_count": 1,
            "username": "admin",
            "password": "",
            "last_action": "",
            "ping_target": "",
            "fping_start_ip": "",
            "fping_end_ip": "",
            "route_get_target": "",
            "curl_target": "",
            "curl_method": "GET",
            "docker_container": "",
            "service_name": "",
            "custom_command": "",
        }
    )

@app.post("/", response_class=HTMLResponse)
def run_command(
    request: Request,
    ip: str = Form(...),
    ip2: str = Form(""),
    ip3: str = Form(""),
    ip4: str = Form(""),
    ip5: str = Form(""),
    ip6: str = Form(""),
    ip7: str = Form(""),
    ip8: str = Form(""),
    ip9: str = Form(""),
    ip10: str = Form(""),
    machine_count: str = Form("1"),
    username: str = Form(...),
    password: str = Form(...),
    action: str = Form(...),
    ping_target: str = Form(""),
    fping_start_ip: str = Form(""),
    fping_end_ip: str = Form(""),
    route_get_target: str = Form(""),
    curl_target: str = Form(""),
    curl_method: str = Form("GET"),
    docker_container: str = Form(""),
    service_name: str = Form(""),
    custom_command: str = Form(""),
):
    ip = ip.strip()
    ip2 = ip2.strip()
    ip3 = ip3.strip()
    ip4 = ip4.strip()
    ip5 = ip5.strip()
    ip6 = ip6.strip()
    ip7 = ip7.strip()
    ip8 = ip8.strip()
    ip9 = ip9.strip()
    ip10 = ip10.strip()
    username = username.strip()
    ping_target = ping_target.strip()
    fping_start_ip = fping_start_ip.strip()
    fping_end_ip = fping_end_ip.strip()
    route_get_target = route_get_target.strip()
    curl_target = curl_target.strip()
    curl_method = curl_method.strip().upper()
    docker_container = docker_container.strip()
    service_name = service_name.strip()
    custom_command = custom_command.strip()
    result_blocks = []
    ip_values = [ip, ip2, ip3, ip4, ip5, ip6, ip7, ip8, ip9, ip10]

    try:
        machine_count_value = int(machine_count)
    except ValueError:
        machine_count_value = 1
    machine_count_value = max(1, min(10, machine_count_value))

    if not username:
        output = "Error: username is required."
    else:
        hosts = ip_values[:machine_count_value]
        invalid_hosts = []
        missing_hosts = []
        for idx, host in enumerate(hosts, start=1):
            if not host:
                missing_hosts.append(idx)
                continue
            if not _is_ipv4(host):
                invalid_hosts.append((idx, host))

        if missing_hosts:
            output = (
                "Error: missing IPv4 for machine "
                + ", ".join(str(idx) for idx in missing_hosts)
                + "."
            )
            cmd = ""
        elif invalid_hosts:
            output = (
                "Error: invalid IPv4 for machine "
                + ", ".join(f"{idx} ({host})" for idx, host in invalid_hosts)
                + "."
            )
            cmd = ""
        else:
            cmd = ""
            if action == "ping":
                if not ping_target:
                    output = "Error: ping target is required."
                    cmd = ""
                elif not _is_host_or_ipv4(ping_target):
                    output = "Error: invalid ping target."
                    cmd = ""
                else:
                    cmd = f"ping -c 4 {ping_target}"
            elif action == "fping_scan":
                if not fping_start_ip or not fping_end_ip:
                    output = "Error: both start and end IPv4 are required."
                    cmd = ""
                elif not _is_ipv4(fping_start_ip) or not _is_ipv4(fping_end_ip):
                    output = "Error: invalid IPv4 range for fping."
                    cmd = ""
                elif _ipv4_to_int(fping_start_ip) > _ipv4_to_int(fping_end_ip):
                    output = "Error: start IPv4 must be <= end IPv4."
                    cmd = ""
                else:
                    cmd = (
                        f"fping -a -g {shlex.quote(fping_start_ip)} {shlex.quote(fping_end_ip)} "
                        "2>/dev/null"
                    )
            elif action == "ip_route":
                cmd = "ip route"
            elif action == "ip_route_get":
                if not route_get_target:
                    output = "Error: route target is required."
                    cmd = ""
                elif not _is_host_or_ipv4(route_get_target):
                    output = "Error: invalid route target."
                    cmd = ""
                else:
                    cmd = f"ip route get {route_get_target}"
            elif action == "docker_ps":
                cmd = "docker ps"
            elif action == "docker_stats":
                cmd = "docker stats --no-stream"
            elif action == "docker_logs":
                if not docker_container:
                    output = "Error: docker container name is required."
                    cmd = ""
                elif not _is_docker_container_name(docker_container):
                    output = "Error: invalid docker container name."
                    cmd = ""
                else:
                    cmd = f"docker logs --tail 200 {shlex.quote(docker_container)}"
            elif action == "curl_i":
                if not curl_target:
                    output = "Error: URL is required."
                    cmd = ""
                elif not _is_http_url(curl_target):
                    output = "Error: URL must start with http:// or https://"
                    cmd = ""
                else:
                    cmd = f"curl -I {shlex.quote(curl_target)}"
            elif action == "curl_ss":
                if not curl_target:
                    output = "Error: URL is required."
                    cmd = ""
                elif not _is_http_url(curl_target):
                    output = "Error: URL must start with http:// or https://"
                    cmd = ""
                else:
                    cmd = f"curl -sS {shlex.quote(curl_target)}"
            elif action == "curl_plain":
                if not curl_target:
                    output = "Error: URL is required."
                    cmd = ""
                elif not _is_http_url(curl_target):
                    output = "Error: URL must start with http:// or https://"
                    cmd = ""
                else:
                    cmd = f"curl {shlex.quote(curl_target)}"
            elif action == "curl_x":
                if not curl_target:
                    output = "Error: URL is required."
                    cmd = ""
                elif not _is_http_url(curl_target):
                    output = "Error: URL must start with http:// or https://"
                    cmd = ""
                elif not _is_http_method(curl_method):
                    output = "Error: invalid HTTP method for curl -X."
                    cmd = ""
                else:
                    cmd = f"curl -X {shlex.quote(curl_method)} {shlex.quote(curl_target)}"
            elif action == "df_h":
                cmd = "df -h"
            elif action == "ss_tulpn":
                cmd = "ss -tulpn"
            elif action == "ss_ant":
                cmd = "ss -ant"
            elif action == "uptime":
                cmd = "uptime"
            elif action == "du_var_top20":
                cmd = "du -h /var/log/* 2>/dev/null | sort -h | tail -20"
            elif action == "systemctl_status":
                if not service_name:
                    output = "Error: service name is required."
                    cmd = ""
                elif not _is_systemd_service_name(service_name):
                    output = "Error: invalid service name."
                    cmd = ""
                else:
                    cmd = f"systemctl status {shlex.quote(service_name)} --no-pager"
            elif action == "systemctl_restart":
                if not service_name:
                    output = "Error: service name is required."
                    cmd = ""
                elif not _is_systemd_service_name(service_name):
                    output = "Error: invalid service name."
                    cmd = ""
                else:
                    cmd = f"systemctl restart {shlex.quote(service_name)}"
            elif action == "systemctl_stop":
                if not service_name:
                    output = "Error: service name is required."
                    cmd = ""
                elif not _is_systemd_service_name(service_name):
                    output = "Error: invalid service name."
                    cmd = ""
                else:
                    cmd = f"systemctl stop {shlex.quote(service_name)}"
            elif action == "custom_cmd":
                if not custom_command:
                    output = "Error: custom command is required."
                    cmd = ""
                elif len(custom_command) > 500:
                    output = "Error: custom command is too long."
                    cmd = ""
                else:
                    cmd = custom_command
            else:
                cmd = ""
                output = "Error: unknown action."

        if cmd:
            if len(hosts) == 1:
                single_output = _run_remote_command(
                    hosts[0], username, password, cmd, use_sudo=True
                )
                if action == "fping_scan":
                    single_output = _format_fping_output(
                        single_output, fping_start_ip, fping_end_ip
                    )
                result_blocks = [
                    {
                        "title": f"Output 1 - IP {hosts[0]}",
                        "body": single_output,
                    }
                ]
                output = single_output
            else:
                with ThreadPoolExecutor(max_workers=min(10, len(hosts))) as executor:
                    futures = [
                        executor.submit(
                            _run_remote_command,
                            host,
                            username,
                            password,
                            cmd,
                            True,
                        )
                        for host in hosts
                    ]
                    results = [future.result() for future in futures]
                if action == "fping_scan":
                    results = [
                        _format_fping_output(result, fping_start_ip, fping_end_ip)
                        for result in results
                    ]
                result_blocks = [
                    {
                        "title": f"Output {idx} - IP {host}",
                        "body": result,
                    }
                    for idx, (host, result) in enumerate(zip(hosts, results), start=1)
                ]
                output = "\n\n".join(
                    f"{block['title']}\n{block['body']}" for block in result_blocks
                )

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "result": output,
            "result_blocks": result_blocks,
            "ip": ip,
            "ip2": ip2,
            "ip3": ip3,
            "ip4": ip4,
            "ip5": ip5,
            "ip6": ip6,
            "ip7": ip7,
            "ip8": ip8,
            "ip9": ip9,
            "ip10": ip10,
            "machine_count": machine_count_value,
            "username": username or "admin",
            "password": password,
            "last_action": action,
            "ping_target": ping_target,
            "fping_start_ip": fping_start_ip,
            "fping_end_ip": fping_end_ip,
            "route_get_target": route_get_target,
            "curl_target": curl_target,
            "curl_method": curl_method or "GET",
            "docker_container": docker_container,
            "service_name": service_name,
            "custom_command": custom_command,
        }
    )

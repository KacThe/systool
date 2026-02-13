const form = document.getElementById("cmd-form");
const action = document.getElementById("action");
const runBtn = document.getElementById("run-btn");

const machineCountSelect = document.getElementById("machine-count-select");
const machineIpRows = Array.from(document.querySelectorAll(".machine-ip-row"));

const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");

const pingRow = document.getElementById("ping-row");
const fpingRow = document.getElementById("fping-row");
const routeGetRow = document.getElementById("route-get-row");
const curlRow = document.getElementById("curl-row");
const curlMethodRow = document.getElementById("curl-method-row");
const dockerLogsRow = document.getElementById("docker-logs-row");
const systemctlRow = document.getElementById("systemctl-row");
const customRow = document.getElementById("custom-row");

const curlTargetInput = document.getElementById("curl-target-input");
const curlMethodInput = document.getElementById("curl-method-input");
const dockerContainerInput = document.getElementById("docker-container-input");
const serviceNameInput = document.getElementById("service-name-input");
const servicePreset = document.getElementById("service-preset");
const customCommandInput = document.getElementById("custom-command-input");
const fpingStartInput = document.getElementById("fping-start-input");
const fpingEndInput = document.getElementById("fping-end-input");
const fpingRangePreset = document.getElementById("fping-range-preset");

const pingBtn = document.getElementById("ping-btn");
const fpingBtn = document.getElementById("fping-btn");
const routeBtn = document.getElementById("route-btn");
const routeGetBtn = document.getElementById("route-get-btn");
const curlBtn = document.getElementById("curl-btn");
const curlToggleBtn = document.getElementById("curl-toggle-btn");
const curlMenu = document.getElementById("curl-menu");
const dockerToggleBtn = document.getElementById("docker-toggle-btn");
const dockerMenu = document.getElementById("docker-menu");
const dockerBtn = document.getElementById("docker-btn");
const ssBtn = document.getElementById("ss-btn");
const ssToggleBtn = document.getElementById("ss-toggle-btn");
const ssMenu = document.getElementById("ss-menu");
const dfBtn = document.getElementById("df-btn");
const uptimeBtn = document.getElementById("uptime-btn");
const duVarBtn = document.getElementById("du-var-btn");
const customBtn = document.getElementById("custom-btn");
const systemctlBtn = document.getElementById("systemctl-btn");
const systemctlToggleBtn = document.getElementById("systemctl-toggle-btn");
const systemctlMenu = document.getElementById("systemctl-menu");

const lastAction = action.value || "";
let selectedAction = lastAction || "ping";
let currentCurlAction = "curl_i";
let currentDockerAction = "docker_ps";
let currentSsAction = "ss_tulpn";
let currentSystemctlAction = "systemctl_status";

const LS_USER_KEY = "kacper_hub_username";
const LS_PASS_KEY = "kacper_hub_password";

const ACTION_BUTTONS = {
    custom_cmd: customBtn,
    ping: pingBtn,
    fping_scan: fpingBtn,
    ip_route: routeBtn,
    ip_route_get: routeGetBtn,
    curl_i: curlBtn,
    curl_ss: curlBtn,
    curl_plain: curlBtn,
    curl_x: curlBtn,
    docker_ps: dockerBtn,
    docker_stats: dockerBtn,
    docker_logs: dockerBtn,
    ss_tulpn: ssBtn,
    ss_ant: ssBtn,
    df_h: dfBtn,
    uptime: uptimeBtn,
    du_var_top20: duVarBtn,
    systemctl_status: systemctlBtn,
    systemctl_restart: systemctlBtn,
    systemctl_stop: systemctlBtn,
};

function loadCredentialsFromStorage() {
    try {
        const savedUser = localStorage.getItem(LS_USER_KEY);
        const savedPass = localStorage.getItem(LS_PASS_KEY);
        if (savedUser) usernameInput.value = savedUser;
        if (savedPass) passwordInput.value = savedPass;
    } catch (_) {
        // Ignore browsers/environments with blocked localStorage.
    }
}

function setupCredentialsAutosave() {
    const persist = () => {
        try {
            localStorage.setItem(LS_USER_KEY, usernameInput.value || "");
            localStorage.setItem(LS_PASS_KEY, passwordInput.value || "");
        } catch (_) {
            // Ignore browsers/environments with blocked localStorage.
        }
    };
    usernameInput.addEventListener("input", persist);
    passwordInput.addEventListener("input", persist);
}

function getCurlLabel(selected) {
    if (selected === "curl_i") return "curl -I";
    if (selected === "curl_ss") return "curl -sS";
    if (selected === "curl_plain") return "curl";
    return "curl -X";
}

function getDockerLabel(selected) {
    if (selected === "docker_stats") return "Docker stats";
    if (selected === "docker_logs") return "Docker logs";
    return "Docker ps";
}

function getSsLabel(selected) {
    if (selected === "ss_ant") return "ss -ant";
    return "ss -tulpn";
}

function getSystemctlLabel(selected) {
    if (selected === "systemctl_restart") return "systemctl restart";
    if (selected === "systemctl_stop") return "systemctl stop";
    return "systemctl status";
}

function closeAllMenus() {
    curlMenu.hidden = true;
    dockerMenu.hidden = true;
    ssMenu.hidden = true;
    systemctlMenu.hidden = true;
}

function toggleMenu(menu) {
    const shouldShow = menu.hidden;
    closeAllMenus();
    menu.hidden = !shouldShow;
}

function setMachineCount(count) {
    const value = Math.max(1, Math.min(10, Number(count) || 1));
    machineCountSelect.value = String(value);
    machineIpRows.forEach((row, idx) => {
        const show = idx + 2 <= value;
        row.style.display = show ? "block" : "none";
        const input = row.querySelector("input");
        if (input) input.required = show;
    });
}

function showPingRow(show) {
    pingRow.style.display = show ? "block" : "none";
}

function showFpingRow(show) {
    fpingRow.style.display = show ? "block" : "none";
    fpingStartInput.required = show;
    fpingEndInput.required = show;
}

function showRouteGetRow(show) {
    routeGetRow.style.display = show ? "block" : "none";
}

function showCurlRow(show) {
    curlRow.style.display = show ? "block" : "none";
    curlTargetInput.required = show;
}

function showCurlMethodRow(show) {
    curlMethodRow.style.display = show ? "block" : "none";
    curlMethodInput.required = show;
}

function showDockerLogsRow(show) {
    dockerLogsRow.style.display = show ? "block" : "none";
    dockerContainerInput.required = show;
}

function showSystemctlRow(show) {
    systemctlRow.style.display = show ? "block" : "none";
    serviceNameInput.required = show;
}

function showCustomRow(show) {
    customRow.style.display = show ? "block" : "none";
    customCommandInput.required = show;
}

function hideAllOptionalRows() {
    showPingRow(false);
    showFpingRow(false);
    showRouteGetRow(false);
    showCurlRow(false);
    showCurlMethodRow(false);
    showDockerLogsRow(false);
    showSystemctlRow(false);
    showCustomRow(false);
}

function setActiveButtonState() {
    const selectable = [
        customBtn,
        pingBtn,
        fpingBtn,
        routeBtn,
        routeGetBtn,
        curlBtn,
        dockerBtn,
        ssBtn,
        dfBtn,
        uptimeBtn,
        duVarBtn,
        systemctlBtn,
    ];
    selectable.forEach((btn) => btn.classList.remove("action-selected"));

    const activeBtn = ACTION_BUTTONS[selectedAction];
    if (activeBtn) activeBtn.classList.add("action-selected");

    [curlMenu, dockerMenu, ssMenu, systemctlMenu].forEach((menu) => {
        menu.querySelectorAll(".menu-item").forEach((item) => {
            item.classList.toggle("menu-item-selected", item.dataset.action === selectedAction);
        });
    });
}

function focusForAction(actionName) {
    if (actionName === "ping") {
        const input = pingRow.querySelector("input");
        if (input) input.focus();
        return;
    }
    if (actionName === "fping_scan") {
        if (!fpingStartInput.value.trim()) {
            fpingStartInput.focus();
        } else {
            fpingEndInput.focus();
        }
        return;
    }
    if (actionName === "ip_route_get") {
        const input = routeGetRow.querySelector("input");
        if (input) input.focus();
        return;
    }
    if (actionName === "curl_x") {
        if (!curlMethodInput.value.trim()) {
            curlMethodInput.focus();
        } else {
            curlTargetInput.focus();
        }
        return;
    }
    if (actionName === "curl_i" || actionName === "curl_ss" || actionName === "curl_plain") {
        curlTargetInput.focus();
        return;
    }
    if (actionName === "docker_logs") {
        dockerContainerInput.focus();
        return;
    }
    if (actionName === "systemctl_status" || actionName === "systemctl_restart" || actionName === "systemctl_stop") {
        serviceNameInput.focus();
        return;
    }
    if (actionName === "custom_cmd") {
        customCommandInput.focus();
    }
}

function applySelectedActionToUI() {
    hideAllOptionalRows();

    if (selectedAction === "ping") {
        showPingRow(true);
    } else if (selectedAction === "fping_scan") {
        showFpingRow(true);
    } else if (selectedAction === "ip_route_get") {
        showRouteGetRow(true);
    } else if (selectedAction === "curl_i" || selectedAction === "curl_ss" || selectedAction === "curl_plain" || selectedAction === "curl_x") {
        showCurlRow(true);
        if (selectedAction === "curl_x") showCurlMethodRow(true);
    } else if (selectedAction === "docker_logs") {
        showDockerLogsRow(true);
    } else if (selectedAction === "systemctl_status" || selectedAction === "systemctl_restart" || selectedAction === "systemctl_stop") {
        showSystemctlRow(true);
    } else if (selectedAction === "custom_cmd") {
        showCustomRow(true);
    }

    curlBtn.textContent = getCurlLabel(currentCurlAction);
    dockerBtn.textContent = getDockerLabel(currentDockerAction);
    ssBtn.textContent = getSsLabel(currentSsAction);
    systemctlBtn.textContent = getSystemctlLabel(currentSystemctlAction);
    setActiveButtonState();
}

function selectAction(actionName, focus = false) {
    selectedAction = actionName;
    applySelectedActionToUI();
    if (focus) focusForAction(actionName);
}

function runSelectedAction() {
    action.value = selectedAction;
    applySelectedActionToUI();
    form.requestSubmit();
}

function setupEnterSubmit(input, resolveAction) {
    input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        selectedAction = resolveAction();
        runSelectedAction();
    });
}

if (lastAction === "curl_i" || lastAction === "curl_ss" || lastAction === "curl_plain" || lastAction === "curl_x") {
    currentCurlAction = lastAction;
}
if (lastAction === "docker_ps" || lastAction === "docker_stats" || lastAction === "docker_logs") {
    currentDockerAction = lastAction;
}
if (lastAction === "ss_tulpn" || lastAction === "ss_ant") {
    currentSsAction = lastAction;
}
if (lastAction === "systemctl_status" || lastAction === "systemctl_restart" || lastAction === "systemctl_stop") {
    currentSystemctlAction = lastAction;
}

setMachineCount(machineCountSelect.value || "1");
loadCredentialsFromStorage();
setupCredentialsAutosave();
applySelectedActionToUI();

machineCountSelect.addEventListener("change", () => {
    setMachineCount(machineCountSelect.value);
});

runBtn.addEventListener("click", () => {
    runSelectedAction();
});

customBtn.addEventListener("click", () => selectAction("custom_cmd", true));
pingBtn.addEventListener("click", () => selectAction("ping", true));
fpingBtn.addEventListener("click", () => selectAction("fping_scan", true));
routeBtn.addEventListener("click", () => selectAction("ip_route", false));
routeGetBtn.addEventListener("click", () => selectAction("ip_route_get", true));

curlBtn.addEventListener("click", () => selectAction(currentCurlAction, true));
curlToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(curlMenu);
});

curlMenu.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
        currentCurlAction = item.dataset.action;
        selectAction(currentCurlAction, true);
        curlMenu.hidden = true;
    });
});

dockerBtn.addEventListener("click", () => selectAction(currentDockerAction, true));
dockerToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(dockerMenu);
});

dockerMenu.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
        currentDockerAction = item.dataset.action;
        selectAction(currentDockerAction, true);
        dockerMenu.hidden = true;
    });
});

ssBtn.addEventListener("click", () => selectAction(currentSsAction, false));
ssToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(ssMenu);
});

ssMenu.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
        currentSsAction = item.dataset.action;
        selectAction(currentSsAction, false);
        ssMenu.hidden = true;
    });
});

dfBtn.addEventListener("click", () => selectAction("df_h", false));
uptimeBtn.addEventListener("click", () => selectAction("uptime", false));
duVarBtn.addEventListener("click", () => selectAction("du_var_top20", false));

systemctlBtn.addEventListener("click", () => selectAction(currentSystemctlAction, true));
systemctlToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(systemctlMenu);
});

systemctlMenu.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
        currentSystemctlAction = item.dataset.action;
        selectAction(currentSystemctlAction, true);
        systemctlMenu.hidden = true;
    });
});

setupEnterSubmit(serviceNameInput, () => currentSystemctlAction);
setupEnterSubmit(customCommandInput, () => "custom_cmd");

servicePreset.addEventListener("change", () => {
    if (!servicePreset.value) return;
    serviceNameInput.value = servicePreset.value;
    serviceNameInput.focus();
});

fpingRangePreset.addEventListener("change", () => {
    if (!fpingRangePreset.value) return;
    const [startIp, endIp] = fpingRangePreset.value.split("|");
    fpingStartInput.value = startIp || "";
    fpingEndInput.value = endIp || "";
    fpingEndInput.focus();
});

document.addEventListener("click", () => {
    closeAllMenus();
});

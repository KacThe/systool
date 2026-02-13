const form = document.getElementById("cmd-form");
        const action = document.getElementById("action");
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
        let currentCurlAction = "curl_i";
        let currentDockerAction = "docker_ps";
        let currentSsAction = "ss_tulpn";
        let currentSystemctlAction = "systemctl_status";
        const LS_USER_KEY = "kacper_hub_username";
        const LS_PASS_KEY = "kacper_hub_password";

        function loadCredentialsFromStorage() {
            try {
                const savedUser = localStorage.getItem(LS_USER_KEY);
                const savedPass = localStorage.getItem(LS_PASS_KEY);
                if (savedUser) {
                    usernameInput.value = savedUser;
                }
                if (savedPass) {
                    passwordInput.value = savedPass;
                }
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

        function submitAction(actionName) {
            action.value = actionName;
            form.requestSubmit();
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

        function setupEnterSubmit(input, resolveAction) {
            input.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") {
                    return;
                }
                event.preventDefault();
                submitAction(resolveAction());
            });
        }

        function focusFirstInput(row, fallbackInput) {
            const input = row.querySelector("input");
            if (input) {
                input.focus();
                return;
            }
            if (fallbackInput) {
                fallbackInput.focus();
            }
        }

        function runTwoStepAction({
            actionName,
            row,
            showRow,
            focusInput,
            firstOpenShouldWait = () => true,
        }) {
            action.value = actionName;
            const wasHidden = row.style.display === "none";
            hideAllOptionalRows();
            showRow(true);
            if (wasHidden && firstOpenShouldWait()) {
                focusInput();
                return;
            }
            form.requestSubmit();
        }

        function bindQuickAction(button, getAction) {
            button.addEventListener("click", () => {
                hideAllOptionalRows();
                submitAction(getAction());
            });
        }

        function setMachineCount(count) {
            const value = Math.max(1, Math.min(10, Number(count) || 1));
            machineCountSelect.value = String(value);
            machineIpRows.forEach((row, idx) => {
                const show = idx + 2 <= value;
                row.style.display = show ? "block" : "none";
                const input = row.querySelector("input");
                if (input) {
                    input.required = show;
                }
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

        if (lastAction === "ping") {
            showPingRow(true);
        }
        if (lastAction === "fping_scan") {
            showFpingRow(true);
        }
        if (lastAction === "ip_route_get") {
            showRouteGetRow(true);
        }
        if (lastAction === "curl_i" || lastAction === "curl_ss" || lastAction === "curl_plain" || lastAction === "curl_x") {
            showCurlRow(true);
            currentCurlAction = lastAction;
            if (lastAction === "curl_x") {
                showCurlMethodRow(true);
            }
        }
        if (lastAction === "docker_ps" || lastAction === "docker_stats" || lastAction === "docker_logs") {
            currentDockerAction = lastAction;
            if (lastAction === "docker_logs") {
                showDockerLogsRow(true);
            }
        }
        if (lastAction === "ss_tulpn" || lastAction === "ss_ant") {
            currentSsAction = lastAction;
        }
        if (lastAction === "systemctl_status" || lastAction === "systemctl_restart" || lastAction === "systemctl_stop") {
            currentSystemctlAction = lastAction;
            showSystemctlRow(true);
        }
        if (lastAction === "custom_cmd") {
            showCustomRow(true);
        }
        setMachineCount(machineCountSelect.value || "1");
        loadCredentialsFromStorage();
        setupCredentialsAutosave();
        curlBtn.textContent = getCurlLabel(currentCurlAction);
        dockerBtn.textContent = getDockerLabel(currentDockerAction);
        ssBtn.textContent = getSsLabel(currentSsAction);
        systemctlBtn.textContent = getSystemctlLabel(currentSystemctlAction);
        machineCountSelect.addEventListener("change", () => {
            setMachineCount(machineCountSelect.value);
        });

        bindQuickAction(routeBtn, () => "ip_route");

        pingBtn.addEventListener("click", () => {
            runTwoStepAction({
                actionName: "ping",
                row: pingRow,
                showRow: showPingRow,
                focusInput: () => focusFirstInput(pingRow),
                firstOpenShouldWait: () => true,
            });
        });

        fpingBtn.addEventListener("click", () => {
            runTwoStepAction({
                actionName: "fping_scan",
                row: fpingRow,
                showRow: showFpingRow,
                focusInput: () => fpingStartInput.focus(),
                firstOpenShouldWait: () =>
                    !fpingStartInput.value.trim() || !fpingEndInput.value.trim(),
            });
        });

        routeGetBtn.addEventListener("click", () => {
            runTwoStepAction({
                actionName: "ip_route_get",
                row: routeGetRow,
                showRow: showRouteGetRow,
                focusInput: () => focusFirstInput(routeGetRow),
                firstOpenShouldWait: () => true,
            });
        });

        curlBtn.addEventListener("click", () => {
            action.value = currentCurlAction;
            hideAllOptionalRows();
            showCurlRow(true);
            if (currentCurlAction === "curl_x") {
                showCurlMethodRow(true);
            }
            form.requestSubmit();
        });

        curlToggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleMenu(curlMenu);
        });

        curlMenu.querySelectorAll(".menu-item").forEach((item) => {
            item.addEventListener("click", () => {
                const selected = item.dataset.action;
                currentCurlAction = selected;
                action.value = selected;
                curlBtn.textContent = getCurlLabel(selected);
                curlMenu.hidden = true;
                hideAllOptionalRows();
                showCurlRow(true);
                if (selected === "curl_x") {
                    showCurlMethodRow(true);
                    curlMethodInput.focus();
                } else {
                    curlTargetInput.focus();
                }
            });
        });

        dockerBtn.addEventListener("click", () => {
            action.value = currentDockerAction;
            hideAllOptionalRows();
            if (currentDockerAction === "docker_logs") {
                showDockerLogsRow(true);
            }
            form.requestSubmit();
        });

        dockerToggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleMenu(dockerMenu);
        });

        dockerMenu.querySelectorAll(".menu-item").forEach((item) => {
            item.addEventListener("click", () => {
                const selected = item.dataset.action;
                currentDockerAction = selected;
                action.value = selected;
                dockerBtn.textContent = getDockerLabel(selected);
                dockerMenu.hidden = true;
                hideAllOptionalRows();
                if (selected === "docker_logs") {
                    showDockerLogsRow(true);
                    dockerContainerInput.focus();
                    return;
                }
                form.requestSubmit();
            });
        });

        bindQuickAction(ssBtn, () => currentSsAction);

        ssToggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleMenu(ssMenu);
        });

        ssMenu.querySelectorAll(".menu-item").forEach((item) => {
            item.addEventListener("click", () => {
                const selected = item.dataset.action;
                currentSsAction = selected;
                action.value = selected;
                ssBtn.textContent = getSsLabel(selected);
                ssMenu.hidden = true;
                hideAllOptionalRows();
                form.requestSubmit();
            });
        });

        bindQuickAction(dfBtn, () => "df_h");
        bindQuickAction(uptimeBtn, () => "uptime");
        bindQuickAction(duVarBtn, () => "du_var_top20");

        customBtn.addEventListener("click", () => {
            runTwoStepAction({
                actionName: "custom_cmd",
                row: customRow,
                showRow: showCustomRow,
                focusInput: () => customCommandInput.focus(),
                firstOpenShouldWait: () => !customCommandInput.value.trim(),
            });
        });

        systemctlBtn.addEventListener("click", () => {
            runTwoStepAction({
                actionName: currentSystemctlAction,
                row: systemctlRow,
                showRow: showSystemctlRow,
                focusInput: () => serviceNameInput.focus(),
                firstOpenShouldWait: () => !serviceNameInput.value.trim(),
            });
        });

        systemctlToggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleMenu(systemctlMenu);
        });

        systemctlMenu.querySelectorAll(".menu-item").forEach((item) => {
            item.addEventListener("click", () => {
                const selected = item.dataset.action;
                currentSystemctlAction = selected;
                action.value = selected;
                systemctlBtn.textContent = getSystemctlLabel(selected);
                systemctlMenu.hidden = true;
                hideAllOptionalRows();
                showSystemctlRow(true);
                serviceNameInput.focus();
            });
        });

        setupEnterSubmit(serviceNameInput, () => currentSystemctlAction);
        setupEnterSubmit(customCommandInput, () => "custom_cmd");

        servicePreset.addEventListener("change", () => {
            if (!servicePreset.value) {
                return;
            }
            serviceNameInput.value = servicePreset.value;
            serviceNameInput.focus();
        });

        fpingRangePreset.addEventListener("change", () => {
            if (!fpingRangePreset.value) {
                return;
            }
            const [startIp, endIp] = fpingRangePreset.value.split("|");
            fpingStartInput.value = startIp || "";
            fpingEndInput.value = endIp || "";
            fpingEndInput.focus();
        });

        document.addEventListener("click", () => {
            closeAllMenus();
        });

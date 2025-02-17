let rowCounter; // ตัวแปรเก็บลำดับแถว

document.addEventListener('DOMContentLoaded', function () {
    const offGridRadio = document.getElementById('offGrid'); // ตัวเลือก Off-Grid
    const batterySystemDiv = document.getElementById('batterySystem'); // ระบบแบตเตอรี่
    const systemTypeRadios = document.querySelectorAll('input[name="systemType"]'); // ตัวเลือกประเภททั้งหมด

    // โหลดข้อมูลจังหวัดและอุปกรณ์เริ่มต้น
    loadProvinces(); // โหลดข้อมูลจังหวัด
    initializeDeviceTable(); // โหลดข้อมูลอุปกรณ์ในแถวเริ่มต้น

    // เพิ่ม Event Listener ให้กับปุ่มวิทยุทุกปุ่ม
    systemTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (offGridRadio.checked) {
                batterySystemDiv.style.display = 'block';
            } else {
                batterySystemDiv.style.display = 'none';
            }
            updateSolarPanelSelection(); // อัปเดตข้อมูลแผงโซลาร์เซลล์
        });
    });

    // ตรวจสอบค่าเริ่มต้นเมื่อโหลดหน้า
    if (offGridRadio.checked) {
        batterySystemDiv.style.display = 'block';
    } else {
        batterySystemDiv.style.display = 'none';
    }

    // อัปเดตข้อมูลแผงโซลาร์เซลล์ทันทีที่โหลดหน้า
    updateSolarPanelSelection();
});


// ฟังก์ชันโหลดข้อมูลจังหวัด
async function loadProvinces() {
    try {
        const response = await fetch('/static/provinces.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch provinces: ${response.status}`);
        }
        const data = await response.json();

        const datalist = document.getElementById('provinceList');
        datalist.innerHTML = ""; // ล้างค่าเก่าใน datalist

        data.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading provinces:', error);
    }
}

// ฟังก์ชันโหลดตัวเลือกแบตเตอรี่
async function loadBatteryOptions() {
    try {
        const response = await fetch('static/battery_list.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch battery list: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === "success") {
            const batterySystemDiv = document.getElementById('batterySystem');
            batterySystemDiv.innerHTML = '<label>เลือกระบบแบตเตอรี่:</label>'; // ล้างตัวเลือกเก่า

            data.data.forEach(battery => {
                const batteryId = `battery${battery.Voltage}`;
                const input = document.createElement('input');
                input.type = 'radio';
                input.id = batteryId;
                input.name = 'batterySystem';
                input.value = battery.Voltage;

                const label = document.createElement('label');
                label.htmlFor = batteryId;
                label.textContent = `${battery.Voltage}V (${battery.Brand} - ${battery.Capacity}Ah, ${battery.Price} THB)`;

                batterySystemDiv.appendChild(input);
                batterySystemDiv.appendChild(label);
            });
        } else {
            console.error('Error loading battery options:', data.message);
        }
    } catch (error) {
        console.error('Error loading battery options:', error);
    }
}

// ฟังก์ชันคำนวณขนาดแบตเตอรี่
function calculateBatteryCapacity(totalEnergy, selectedBatteryVoltage) {
    if (!totalEnergy || !selectedBatteryVoltage) return 0;

    // คำนวณ Ah: (พลังงานรวมต่อวัน / 0.8) / แรงดันแบตเตอรี่ที่เลือก
    const batteryCapacity = (totalEnergy / 0.8) / selectedBatteryVoltage;
    return batteryCapacity.toFixed(2); // คืนค่า 2 ตำแหน่งทศนิยม
}

// ฟังก์ชันแสดงผลข้อมูลที่เลือกและปรับประเภท
async function drawRectangle() {
    console.log("กำลังแสดงผลข้อมูล...");

    const selectedSystemType = document.querySelector('input[name="systemType"]:checked');
    const selectedBattery = document.querySelector('input[name="batterySystem"]:checked');
    const batteryContainer = document.getElementById('batteryDetails');
    const panelContainer = document.getElementById('panelSystem');
    const priceSummary = document.getElementById('priceSummary');
    const solarInstallationDisplay = document.getElementById('solarInstallationDisplay'); // แสดงกำลังติดตั้งแผงโซลาร์เซลล์

    // รีเซ็ตผลลัพธ์ก่อนเริ่มต้น
    batteryContainer.style.display = 'none';
    panelContainer.style.display = 'none';
    batteryContainer.innerHTML = '';
    panelContainer.innerHTML = '';
    priceSummary.textContent = "ประมาณราคา = ";
    solarInstallationDisplay.textContent = ""; // เคลียร์ค่าก่อนแสดงใหม่

    // ตรวจสอบประเภทระบบ Off-Grid
    if (!selectedSystemType || selectedSystemType.id !== 'offGrid') {
        alert("กรุณาเลือกประเภทระบบ Off-Grid ก่อน");
        return;
    }

    // ตรวจสอบการเลือกแบตเตอรี่
    if (!selectedBattery) {
        alert('กรุณาเลือกระบบแบตเตอรี่');
        return;
    }

    const voltage = parseFloat(selectedBattery.value);
    const totalEnergy = parseFloat(calculateTotalEnergyPerDay());

    if (isNaN(totalEnergy) || totalEnergy <= 0) {
        alert("กรุณาใส่ข้อมูลอุปกรณ์เพื่อคำนวณพลังงานรวม");
        return;
    }

    // คำนวณขนาดแบตเตอรี่ที่ต้องใช้ (Wh)
    const requiredBatteryCapacityWh = (totalEnergy / 0.8).toFixed(2);

    // คำนวณกำลังติดตั้งแผงโซลาร์เซลล์ (W) โดยใช้ชั่วโมงแสงอาทิตย์ 4 ชั่วโมง
    const requiredSolarPowerW = (requiredBatteryCapacityWh / 4).toFixed(2);

    // แสดงค่ากำลังติดตั้งแผงโซลาร์เซลล์
    solarInstallationDisplay.innerHTML = `<strong>กำลังติดตั้งแผงโซลาร์เซลล์ที่ต้องใช้: ${requiredSolarPowerW} W</strong>`;

    try {
        // โหลดข้อมูลแบตเตอรี่
        const batteryResponse = await fetch('/get_battery_list');
        const batteryResult = await batteryResponse.json();

        if (batteryResult.status === 'success') {
            const filteredData = batteryResult.data.filter(battery =>
                parseFloat(battery["Voltage (V)"]) === voltage);

            if (filteredData.length > 0) {
                let batteryTable = `
                    <table>
                        <thead>
                            <tr>
                                <th>เลือก</th>
                                <th>Brand</th>
                                <th>Voltage (V)</th>
                                <th>Capacity (Ah)</th>
                                <th>Price (THB)</th>
                                <th>จำนวนที่ต้องใช้</th>
                                <th>ราคารวม (THB)</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                filteredData.forEach((battery, index) => {
                    const capacity = parseFloat(battery["Capacity (Ah)"]);
                    const price = parseFloat(battery["Price (THB)"]);
                    const quantityRequired = Math.ceil(requiredBatteryCapacityWh / (capacity * voltage));
                    const totalPrice = quantityRequired * price;

                    batteryTable += `
                        <tr>
                            <td><input type="radio" name="batterySelect" value="${index}" data-total-price="${totalPrice}" class="battery-radio"></td>
                            <td>${battery["Brand"] || "ไม่ระบุ"}</td>
                            <td>${battery["Voltage (V)"]}</td>
                            <td>${capacity.toLocaleString()}</td>
                            <td>${price.toLocaleString()}</td>
                            <td>${quantityRequired}</td>
                            <td>${totalPrice.toLocaleString()}</td>
                        </tr>
                    `;
                });
                batteryTable += '</tbody></table>';
                batteryContainer.innerHTML = batteryTable;
                batteryContainer.style.display = 'block';
            } else {
                batteryContainer.innerHTML = `<p>ไม่มีข้อมูลแบตเตอรี่สำหรับแรงดัน ${voltage}V</p>`;
                batteryContainer.style.display = 'block';
            }
        }

        // โหลดข้อมูลและแสดงตารางแผง
        await loadSolarPanelOptions(panelContainer, totalEnergy);

    } catch (error) {
        console.error('Error fetching data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}


async function handleOffGridSelection(province, selectedBattery) {
    const batteryDetails = document.getElementById('batteryDetails');
    if (!selectedBattery) {
        alert('กรุณาเลือกระบบแบตเตอรี่');
        return;
    }

    document.getElementById('selectedProvince').textContent = `จังหวัด: ${province || '-'}`;
    document.getElementById('selectedSystemType').textContent = 'ประเภท: Off-Grid';
    batteryDetails.style.display = 'block';

    const voltage = selectedBattery.value; // แรงดันแบตเตอรี่
    await displayFilteredBatteryList(voltage); // แสดงตารางแบตเตอรี่
}

function handleOtherSystemSelection(province, selectedSystemType) {
    const batteryDetails = document.getElementById('batteryDetails');

    document.getElementById('selectedProvince').textContent = `จังหวัด: ${province || '-'}`;
    document.getElementById('selectedSystemType').textContent = `ประเภท: ${selectedSystemType ? selectedSystemType.labels[0].textContent : '-'}`;
    batteryDetails.style.display = 'none';
    batteryDetails.innerHTML = ''; // ล้างเนื้อหาในตารางแบตเตอรี่
}


// ฟังก์ชันโหลดข้อมูลอุปกรณ์สำหรับแถวใหม่
function loadDevicesForRow(rowNumber) {
    fetch('/static/devices.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch devices: ${response.status}`);
            }
            return response.json();
        })
        .then(devices => {
            const dataList = document.getElementById(`deviceList${rowNumber}`);
            dataList.innerHTML = ""; // ล้างรายการเก่าออกก่อน

            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.name;
                dataList.appendChild(option);
            });

            const deviceInput = document.querySelector(`input[name="device${rowNumber}"]`);

            // แทนที่ input device เพื่อเคลียร์ event listener เก่า
            const newDeviceInput = deviceInput.cloneNode(true);
            deviceInput.parentNode.replaceChild(newDeviceInput, deviceInput);

            // เพิ่ม event listener สำหรับ input device
            newDeviceInput.addEventListener('input', function () {
                const selectedDevice = devices.find(device => device.name === newDeviceInput.value);
                const powerInput = document.querySelector(`input[name="power${rowNumber}"]`);
                powerInput.value = selectedDevice ? selectedDevice.power : '';
            });
        })
        .catch(error => console.error('Error loading devices:', error));
}

function handleSystemTypeChange() {
    const selectedSystemType = document.querySelector('input[name="systemType"]:checked');
    const batterySystemDiv = document.getElementById('batterySystem');
    const batteryDetails = document.getElementById('batteryDetails');
    const priceSummary = document.getElementById('priceSummary'); // ช่องแสดงผลประมาณราคา

    if (selectedSystemType && selectedSystemType.id === 'offGrid') {
        // ถ้าประเภทคือ Off-Grid ให้แสดงตัวเลือกแบตเตอรี่
        batterySystemDiv.style.display = 'block';
    } else {
        // ถ้าประเภทอื่น ซ่อนตัวเลือกแบตเตอรี่และข้อมูลแบตเตอรี่
        batterySystemDiv.style.display = 'none';
        batteryDetails.style.display = 'none'; // ซ่อนตารางแบตเตอรี่
        batteryDetails.innerHTML = ''; // ล้างข้อมูลแบตเตอรี่
        priceSummary.textContent = "ประมาณราคา = "; // ล้างข้อมูลราคา
    }
}

// ฟังก์ชันเริ่มต้นโหลดข้อมูลอุปกรณ์ในแถวที่มีอยู่
function initializeDeviceTable() {
    const rows = document.querySelectorAll('#deviceTable tr');
    rowCounter = rows.length - 1; // ลบ 1 เพื่อไม่นับแถวหัวตาราง

    for (let i = 1; i <= rowCounter; i++) {
        loadDevicesForRow(i); // โหลดข้อมูลอุปกรณ์สำหรับแต่ละแถว
        addCalculationListener(i); // เพิ่ม event listener สำหรับการคำนวณ Wh/วัน
    }
}

// ฟังก์ชันเพิ่มแถวอุปกรณ์
function addDeviceRow() {
    rowCounter++;
    const table = document.getElementById('deviceTable');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCounter}</td>
        <td>
            <input list="deviceList${rowCounter}" name="device${rowCounter}" placeholder="ชื่ออุปกรณ์">
            <datalist id="deviceList${rowCounter}"></datalist>
            <button type="button" class="reset-button" onclick="resetRow(this)">
                <img src="/static/refresh-icon.jpg" alt="Reset">
            </button>
        </td>
        <td><input type="text" name="power${rowCounter}" placeholder="W"></td>
        <td><input type="text" name="quantity${rowCounter}" placeholder="จำนวน"></td>
        <td><input type="text" name="hours${rowCounter}" placeholder="ชม./วัน"></td>
        <td><input type="text" name="watt${rowCounter}" placeholder="Wh/วัน" readonly></td>
        <td>
            <button type="button" class="delete-button" onclick="deleteRow(this)">
                <img src="/static/delete-icon.png" alt="Delete">
            </button>
        </td>
    `;

    table.appendChild(row);

    loadDevicesForRow(rowCounter); // โหลดข้อมูลอุปกรณ์สำหรับแถวใหม่
    addCalculationListener(rowCounter); // ผูก Event Listener สำหรับการคำนวณ
}

function resetRow(button) {
    const row = button.closest('tr'); // ค้นหาแถวที่ปุ่มอยู่
    if (row) {
        // รีเซ็ตค่าใน input
        row.querySelector('input[name^="device"]').value = '';
        row.querySelector('input[name^="power"]').value = '';
        row.querySelector('input[name^="quantity"]').value = '';
        row.querySelector('input[name^="hours"]').value = '';
        row.querySelector('input[name^="watt"]').value = '';

        // ดึงหมายเลขแถวจากชื่อ input (เช่น device1 -> 1)
        const rowNumber = row.querySelector('input[name^="device"]').getAttribute('name').match(/\d+$/)[0];

        // โหลดข้อมูลอุปกรณ์ใหม่และรีผูก event listener
        loadDevicesForRow(rowNumber);
        addCalculationListener(rowNumber);
    }
}

// ฟังก์ชันลบแถวและปรับลำดับ
function deleteRow(button) {
    const row = button.closest('tr'); // ค้นหาแถวที่ปุ่มอยู่
    row.remove(); // ลบแถวออกจาก DOM

    const rows = document.querySelectorAll('#deviceTable tr'); // ดึงแถวที่เหลือทั้งหมด
    rowCounter = rows.length - 1; // ปรับจำนวนแถวที่เหลือ

    rows.forEach((row, index) => {
        if (index > 0) { // ข้ามหัวตาราง
            const rowNumber = index;

            // อัปเดตลำดับในคอลัมน์แรก
            row.querySelector('td:first-child').textContent = rowNumber;

            // อัปเดตชื่อและ ID ของ input/datalist ในแถว
            row.querySelectorAll('input').forEach(input => {
                const originalName = input.getAttribute('name');
                if (originalName) {
                    const newName = originalName.replace(/\d+$/, rowNumber);
                    input.setAttribute('name', newName);
                }
            });

            const datalist = row.querySelector('datalist');
            if (datalist) {
                datalist.setAttribute('id', `deviceList${rowNumber}`);
            }

            // รีโหลดข้อมูลอุปกรณ์และรีผูก event listener ใหม่
            loadDevicesForRow(rowNumber);
            addCalculationListener(rowNumber);
        }
    });
}

// ฟังก์ชันเพิ่ม event listener เพื่อคำนวณ Wh/วัน
function addCalculationListener(rowNumber) {
    const quantityInput = document.querySelector(`input[name="quantity${rowNumber}"]`);
    const hoursInput = document.querySelector(`input[name="hours${rowNumber}"]`);

    quantityInput.addEventListener('input', function () {
        calculateWattPerDay(rowNumber);
    });

    hoursInput.addEventListener('input', function () {
        calculateWattPerDay(rowNumber);
    });
}

// ฟังก์ชันคำนวณ Wh/วัน
function calculateWattPerDay(rowNumber) {
    const power = parseFloat(document.querySelector(`input[name="power${rowNumber}"]`).value) || 0;
    const quantity = parseFloat(document.querySelector(`input[name="quantity${rowNumber}"]`).value) || 0;
    const hours = parseFloat(document.querySelector(`input[name="hours${rowNumber}"]`).value) || 0;

    const wattPerDay = power * quantity * hours;
    document.querySelector(`input[name="watt${rowNumber}"]`).value = wattPerDay.toFixed(2); // แสดงผลด้วยทศนิยม 2 ตำแหน่ง

    // อัปเดตพลังงานรวมทั้งหมด
    updateTotalEnergyDisplay();
}

// ฟังก์ชันคำนวณพลังงานรวมทั้งหมด
function calculateTotalEnergyPerDay() {
    let totalEnergy = 0;

    for (let i = 1; i <= rowCounter; i++) {
        const wattInput = document.querySelector(`input[name="watt${i}"]`);
        if (wattInput) {
            totalEnergy += parseFloat(wattInput.value) || 0;
        }
    }

    return totalEnergy.toFixed(2); // คืนค่าทศนิยม 2 ตำแหน่ง
}

// ฟังก์ชันอัปเดตพลังงานรวมทั้งหมดในหน้าเว็บ
function updateTotalEnergyDisplay() {
    const rows = document.querySelectorAll('#deviceTable tr');
    let totalEnergy = 0;

    rows.forEach((row, index) => {
        if (index > 0) { // ข้ามหัวตาราง
            const wattInput = row.querySelector(`input[name^="watt"]`);
            if (wattInput) {
                totalEnergy += parseFloat(wattInput.value) || 0;
            }
        }
    });

    const totalEnergyDisplay = document.getElementById('totalEnergyDisplay');
    totalEnergyDisplay.textContent = `พลังงานรวมทั้งหมดต่อวัน: ${totalEnergy.toFixed(2)} Wh`;
}

document.querySelectorAll('input[name="systemType"]').forEach(radio => {
    radio.addEventListener('change', handleSystemTypeChange); // เรียกฟังก์ชันทุกครั้งที่เลือกประเภท
});

// เรียกฟังก์ชันนี้ทุกครั้งที่เปลี่ยนประเภท
document.querySelectorAll('input[name="systemType"]').forEach(radio => {
    radio.addEventListener('change', handleSystemTypeChange);
});

// เรียกฟังก์ชันเมื่อหน้าโหลด
document.addEventListener('DOMContentLoaded', handleSystemTypeChange);

// เรียกฟังก์ชันเมื่อหน้าโหลด
document.addEventListener('DOMContentLoaded', function () {
    handleSystemTypeChange();
});


function handleBatterySelection() {
    const selectedBattery = document.querySelector('input[name="batterySystem"]:checked');
    const batteryContainer = document.getElementById('batteryDetails');
    if (!selectedBattery) {
        // ซ่อนตารางหากไม่ได้เลือกแบตเตอรี่
        batteryContainer.style.display = 'none';
        batteryContainer.innerHTML = '';
    }
    // ไม่แสดงผลใดๆ ที่นี่ ให้ทำเฉพาะใน drawRectangle()
}

document.addEventListener('DOMContentLoaded', function () {
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetForm);
        console.log("Reset button listener added."); // ตรวจสอบจุดนี้
    } else {
        console.error("Reset button not found in DOM.");
    }
});


document.getElementById('resetButton').addEventListener('click', resetForm);

function resetForm() {
    console.log("Reset form triggered");
    const confirmReset = confirm("คุณต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?");
    if (!confirmReset) {
        console.log("Reset cancelled by user");
        return; // ยกเลิกการรีเซ็ตถ้าผู้ใช้กด "ยกเลิก"
    }

    // รีเซ็ตฟอร์ม
    const form = document.getElementById('rectangleForm');
    if (form) {
        form.reset();
        console.log("Form reset.");
    } else {
        console.error("Form not found.");
    }

    // ซ่อนข้อมูลแบตเตอรี่และข้อความ
    const batterySystemDiv = document.getElementById('batterySystem');
    const batteryDetails = document.getElementById('batteryDetails');
    const priceSummary = document.getElementById('priceSummary');
    const totalEnergyDisplay = document.getElementById('totalEnergyDisplay');

    if (batterySystemDiv) batterySystemDiv.style.display = 'none';
    if (batteryDetails) {
        batteryDetails.style.display = 'none';
        batteryDetails.innerHTML = '';
    }
    if (priceSummary) priceSummary.textContent = "ประมาณราคา = ";
    if (totalEnergyDisplay) totalEnergyDisplay.textContent = "พลังงานรวมทั้งหมดต่อวัน: 0.00 Wh";

    // ลบแถวในตารางอุปกรณ์ ยกเว้นหัวตาราง
    const deviceTable = document.getElementById('deviceTable');
    if (deviceTable) {
        const rows = deviceTable.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index > 0) row.remove(); // ลบแถวที่ไม่ใช่หัวตาราง
        });

        // เพิ่มแถวเริ่มต้นใหม่
        const initialRow = `
            <tr>
                <td>1</td>
                <td>
                    <input list="deviceList1" name="device1" placeholder="ชื่ออุปกรณ์">
                    <datalist id="deviceList1"></datalist>
                    <button type="button" class="reset-button" onclick="resetRow(this)">
                        <img src="/static/refresh-icon.jpg" alt="Reset">
                    </button>
                </td>
                <td><input type="text" name="power1" placeholder="W"></td>
                <td><input type="text" name="quantity1" placeholder="จำนวน"></td>
                <td><input type="text" name="hours1" placeholder="ชม./วัน"></td>
                <td><input type="text" name="watt1" placeholder="Wh/วัน" readonly></td>
                <td>
                    <button type="button" class="delete-button" onclick="deleteRow(this)">
                        <img src="/static/delete-icon.png" alt="Delete">
                    </button>
                </td>
            </tr>
        `;
        deviceTable.insertAdjacentHTML('beforeend', initialRow);
        console.log("Device table reset.");
    } else {
        console.error("Device table not found.");
    }

    console.log("Form reset complete.");
}

const panelSystemDiv = document.getElementById('panelSystem');
panelSystemDiv.innerHTML = '<label>เลือกระบบแผงโซลาร์เซลล์:</label>';

async function fetchAndSanitizeJSON(url) {
    try {
        const response = await fetch(url);
        const text = await response.text(); // รับข้อมูลเป็นข้อความ
        const sanitizedText = text.replace(/NaN/g, "null"); // แทนที่ NaN ด้วย null
        const data = JSON.parse(sanitizedText); // แปลงข้อความ JSON เป็น Object
        return data;
    } catch (error) {
        console.error("Error fetching or sanitizing JSON:", error);
        return null;
    }
}

async function loadSolarPanelOptions(panelContainer, totalEnergy) {
    try {
        const response = await fetch('/get_panel_list');
        if (!response.ok) {
            throw new Error(`Failed to fetch panel list: ${response.status}`);
        }

        const responseText = await response.text();
        const sanitizedText = responseText.replace(/\bNaN\b/g, 'null');
        const data = JSON.parse(sanitizedText);

        if (data.status === "success") {
            // คำนวณกำลังติดตั้งแผงโซลาร์เซลล์ (W) จากพลังงานรวมต่อวัน
            const requiredBatteryCapacityWh = (totalEnergy / 0.8).toFixed(2);
            const requiredSolarPowerW = (requiredBatteryCapacityWh / 4).toFixed(2);

            let panelTable = `
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>เลือก</th>
                            <th>แบรนด์</th>
                            <th>กำลังไฟฟ้า (W)</th>
                            <th>ความกว้าง (m)</th>
                            <th>ความยาว (m)</th>
                            <th>ราคา (THB)</th>
                            <th>จำนวนแผงที่ต้องใช้</th>
                            <th>ราคารวม (THB)</th>
                            <th>ข้อมูลเพิ่มเติม</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.data.forEach((panel, index) => {
                const watt = parseFloat(panel.Watt) || 0;
                const brand = panel.Brand || "ไม่ระบุ";
                const price = parseFloat(panel.Price) || 0;
                const width = panel.Width_m ? parseFloat(panel.Width_m).toFixed(3) : "ไม่ระบุ";
                const length = panel.Length_m ? parseFloat(panel.Length_m).toFixed(3) : "ไม่ระบุ";
                const datasheet = panel.Datasheet || "ไม่มีข้อมูล";
                
                // คำนวณจำนวนแผงที่ต้องใช้
                const panelQuantity = watt > 0 ? Math.ceil(requiredSolarPowerW / watt) : "ไม่สามารถคำนวณได้";

                // คำนวณราคารวม
                const totalPrice = (typeof panelQuantity === "number" && price > 0) ? (panelQuantity * price).toLocaleString() : "ไม่สามารถคำนวณได้";

                panelTable += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><input type="radio" name="panelSelect" value="${index}" class="panel-radio"></td>
                        <td>${brand}</td>
                        <td>${watt}</td>
                        <td>${width}</td>
                        <td>${length}</td>
                        <td>${price.toLocaleString()}</td>
                        <td>${panelQuantity}</td>
                        <td>${totalPrice}</td>
                        <td><a href="${panel.URL}" target="_blank">${datasheet}</a></td>
                    </tr>
                `;
            });

            panelTable += '</tbody></table>';
            panelContainer.innerHTML = panelTable;
            panelContainer.style.display = 'block';
        } else {
            panelContainer.innerHTML = '<p>ไม่สามารถโหลดข้อมูลแผงโซลาร์เซลล์ได้</p>';
            panelContainer.style.display = 'block';
        }
    } catch (error) {
        console.error("Error fetching panel list:", error);
        panelContainer.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูลแผงโซลาร์เซลล์</p>';
        panelContainer.style.display = 'block';
    }
}



let rowCounter; // ตัวแปรเก็บลำดับแถว

document.addEventListener('DOMContentLoaded', function() {
    loadProvinces(); // โหลดข้อมูลจังหวัด
    loadDevices();   // โหลดข้อมูลอุปกรณ์

    // นับจำนวนแถวที่มีอยู่ในตารางตอนเริ่มต้น
    const rows = document.querySelectorAll('#deviceTable tr');
    rowCounter = rows.length - 1; // ลบ 1 เพื่อไม่นับแถวหัวตาราง
});

// ฟังก์ชันรีเซ็ตค่าของแถวที่เลือก
function resetRow(rowNumber) {
    document.querySelector(`input[name="device${rowNumber}"]`).value = '';
    document.querySelector(`input[name="power${rowNumber}"]`).value = '';
    document.querySelector(`input[name="quantity${rowNumber}"]`).value = '';
    document.querySelector(`input[name="hours${rowNumber}"]`).value = '';
    document.querySelector(`input[name="watt${rowNumber}"]`).value = '';
}

// ฟังก์ชันลบแถวและปรับลำดับ
function deleteRow(button) {
    const row = button.closest('tr'); // ค้นหาแถวที่ปุ่มอยู่
    row.remove(); // ลบแถว

    // ปรับลำดับของแถวที่เหลือ
    const rows = document.querySelectorAll('#deviceTable tr');
    for (let i = 1; i < rows.length; i++) { // เริ่มที่ 1 เพื่อข้ามแถวหัวตาราง
        const cells = rows[i].querySelectorAll('td');
        cells[0].textContent = i; // ปรับลำดับในเซลล์แรก

        // ปรับชื่อและ list ของ input ในแถว
        const deviceInput = cells[1].querySelector('input');
        const dataList = cells[1].querySelector('datalist');
        const resetButton = cells[1].querySelector('.reset-button');

        deviceInput.name = `device${i}`;
        deviceInput.setAttribute('list', `deviceList${i}`);
        dataList.id = `deviceList${i}`;
        resetButton.setAttribute('onclick', `resetRow(${i})`);

        // ปรับชื่อของ input อื่น ๆ
        cells[2].querySelector('input').name = `power${i}`;
        cells[3].querySelector('input').name = `quantity${i}`;
        cells[4].querySelector('input').name = `hours${i}`;
        cells[5].querySelector('input').name = `watt${i}`;

        // ปรับปุ่มลบ
        const deleteButton = cells[6].querySelector('.delete-button');
        deleteButton.setAttribute('onclick', `deleteRow(this)`);
    }

    // ปรับค่า rowCounter
    rowCounter = rows.length - 1;
}

// ฟังก์ชันเพิ่มแถวอุปกรณ์
function addDeviceRow() {
    if (typeof rowCounter === 'undefined') {
        rowCounter = 0; // กำหนดค่าเริ่มต้นให้ rowCounter หากยังไม่มีค่า
    }
    rowCounter++; // เพิ่มตัวเลขของแถว
    const table = document.getElementById('deviceTable');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCounter}</td>
        <td>
            <input list="deviceList${rowCounter}" name="device${rowCounter}" placeholder="ชื่ออุปกรณ์">
            <datalist id="deviceList${rowCounter}"></datalist>
            <button type="button" class="reset-button" onclick="resetRow(${rowCounter})">
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

    // โหลดข้อมูลอุปกรณ์ลงใน datalist ของแถวใหม่
    loadDeviceOptions(rowCounter);

    // เพิ่ม event listener สำหรับการคำนวณ Wh/วัน
    addCalculationListener(rowCounter);
}

// ฟังก์ชันโหลดข้อมูลอุปกรณ์สำหรับแถวใหม่
function loadDeviceOptions(rowNumber) {
    fetch('/static/devices.json')
        .then(response => response.json())
        .then(devices => {
            const dataList = document.getElementById(`deviceList${rowNumber}`);
            devices.forEach(device => {
                let option = document.createElement('option');
                option.value = device.name;
                dataList.appendChild(option);
            });

            // เพิ่ม event listener สำหรับ input ของอุปกรณ์
            const deviceInput = document.querySelector(`input[name="device${rowNumber}"]`);
            deviceInput.addEventListener('input', function() {
                const selectedDevice = devices.find(device => device.name === deviceInput.value);
                if (selectedDevice) {
                    const powerInput = document.querySelector(`input[name="power${rowNumber}"]`);
                    powerInput.value = selectedDevice.power;
                } else {
                    const powerInput = document.querySelector(`input[name="power${rowNumber}"]`);
                    powerInput.value = '';
                }
            });
        })
        .catch(error => console.error('Error loading devices:', error));
}

// ฟังก์ชันโหลดข้อมูลอุปกรณ์ในทุกแถวเริ่มต้น
function loadDevices() {
    fetch('/static/devices.json')
        .then(response => response.json())
        .then(devices => {
            for (let i = 1; i <= rowCounter; i++) {
                const dataList = document.getElementById(`deviceList${i}`);
                devices.forEach(device => {
                    let option = document.createElement('option');
                    option.value = device.name;
                    dataList.appendChild(option);
                });

                const deviceInput = document.querySelector(`input[name="device${i}"]`);
                deviceInput.addEventListener('input', function() {
                    const selectedDevice = devices.find(device => device.name === deviceInput.value);
                    if (selectedDevice) {
                        const powerInput = document.querySelector(`input[name="power${i}"]`);
                        powerInput.value = selectedDevice.power;
                    } else {
                        const powerInput = document.querySelector(`input[name="power${i}"]`);
                        powerInput.value = '';
                    }
                });

                addCalculationListener(i);
            }
        })
        .catch(error => console.error('Error loading devices:', error));
}

// ฟังก์ชันเพิ่ม event listener เพื่อคำนวณ Wh/วัน
function addCalculationListener(rowNumber) {
    const quantityInput = document.querySelector(`input[name="quantity${rowNumber}"]`);
    const hoursInput = document.querySelector(`input[name="hours${rowNumber}"]`);
    
    quantityInput.addEventListener('input', function() {
        calculateWattPerDay(rowNumber);
    });
    
    hoursInput.addEventListener('input', function() {
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
}

// ฟังก์ชันโหลดข้อมูลจังหวัด
async function loadProvinces() {
    try {
        const response = await fetch('/get_provinces');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        let datalist = document.getElementById('provinceList');
        datalist.innerHTML = ""; // ล้างค่าเก่าใน datalist

        data.forEach(province => {
            let option = document.createElement('option');
            option.value = province;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading provinces:', error);
    }
}

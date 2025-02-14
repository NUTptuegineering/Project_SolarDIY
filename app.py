import json
import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ฟังก์ชันสำหรับแสดงหน้าเว็บหลัก
@app.route('/')
def index():
    return render_template('index.html')

# ฟังก์ชันสำหรับจัดการฟอร์มและรับข้อมูล POST
@app.route('/submit', methods=['POST'])
def submit():
    width = request.form.get('width')
    height = request.form.get('height')
    province = request.form.get('province')
    system_type = request.form.get('systemType')

    # ส่งข้อมูลที่รับมาในรูปแบบ JSON
    response_data = {
        "width": width,
        "height": height,
        "province": province,
        "system_type": system_type
    }
    return jsonify(response_data)

# ฟังก์ชันสำหรับดึงข้อมูลจังหวัดจากไฟล์ JSON ใน static
@app.route('/get_provinces', methods=['GET'])
def get_provinces():
    file_path = os.path.join(app.static_folder, 'provinces.json')  # โหลดไฟล์จากโฟลเดอร์ static
    with open(file_path, 'r', encoding='utf-8') as file:
        provinces = json.load(file)
    return jsonify(provinces)

# ฟังก์ชันสำหรับจัดการระบบต่างๆ
@app.route('/system_type', methods=['POST'])
def system_type():
    system_type = request.form.get('systemType')

    if system_type == 'Off-Grid1':
        return handle_off_grid()
    elif system_type == 'On-Grid2':
        return handle_on_grid()
    elif system_type == 'Hybrid3':
        return handle_hybrid()
    else:
        return jsonify({"error": "Invalid system type"}), 400

# ฟังก์ชันสำหรับจัดการระบบต่างๆ
def handle_off_grid():
    return jsonify({"message": "Handling Off-Grid system"})

def handle_on_grid():
    return jsonify({"message": "Handling On-Grid system"})

def handle_hybrid():
    return jsonify({"message": "Handling Hybrid system"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

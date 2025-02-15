import json
import os
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_provinces', methods=['GET'])
def get_provinces():
    file_path = os.path.join(os.getcwd(), 'provinces.json')
    with open(file_path, 'r', encoding='utf-8') as file:
        provinces = json.load(file)
    return jsonify(provinces)

@app.route('/get_battery_list', methods=['GET'])
def get_battery_list():
    file_path = os.path.join(os.getcwd(), 'List_of_equip.xlsx'
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Battery_offgrid"
        df = excel_data.parse(sheet_name)

        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_panel_list', methods=['GET'])
def get_panel_list():
    file_path = os.path.join(app.static_folder, 'List_of_equip.xlsx')
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Solarpanel"
        df = excel_data.parse(sheet_name)

        # เปลี่ยนชื่อคอลัมน์
        rename_columns = {
            "Width(mm.)": "Width_m",
            "Length(mm.)": "Length_m"
        }
        df = df.rename(columns=rename_columns)

        # แปลงค่าจาก mm เป็น m และปัดเศษทศนิยม 3 ตำแหน่ง
        if "Width_m" in df.columns:
            df["Width_m"] = (df["Width_m"] / 1000).round(3)  # mm → m
        if "Length_m" in df.columns:
            df["Length_m"] = (df["Length_m"] / 1000).round(3)  # mm → m

        # ตรวจสอบว่ามีคอลัมน์ที่ต้องการครบหรือไม่
        required_columns = ["Brand", "Watt", "Width_m", "Length_m", "Price", "URL"]
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing column: {col}"}), 500

        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/update_battery', methods=['POST'])
def update_battery():
    file_path = os.path.join(app.static_folder, 'List_of_equip.xlsx')
    try:
        updated_data = request.json.get("data")
        if not updated_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        df = pd.DataFrame(updated_data)

        required_columns = ['Voltage (V)', 'Brand', 'Capacity (Ah)', 'Price (THB)']
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing required column: {col}"}), 400

        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df.to_excel(writer, sheet_name="Battery_offgrid", index=False)

        return jsonify({"status": "success", "message": "Battery list updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_equip_list', methods=['GET'])
def get_equip_list():
    file_path = os.path.join(app.static_folder, 'List_of_equip.xlsx')
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_name = "Battery_offgrid"  # ชื่อ Sheet ที่ต้องการ
        df = excel_data.parse(sheet_name)

        data = df.to_dict(orient="records")
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/update_equip', methods=['POST'])
def update_equip():
    file_path = os.path.join(app.static_folder, 'List_of_equip.xlsx')
    try:
        updated_data = request.json.get("data")
        if not updated_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        df = pd.DataFrame(updated_data)

        required_columns = ['Name', 'Power (W)', 'Quantity']
        for col in required_columns:
            if col not in df.columns:
                return jsonify({"status": "error", "message": f"Missing required column: {col}"}), 400

        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df.to_excel(writer, sheet_name="Equipment_list", index=False)

        return jsonify({"status": "success", "message": "Equipment list updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)

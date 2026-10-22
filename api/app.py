import os
import time
import json
import sqlite3
import hashlib
import random
import hmac
from datetime import datetime
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.PublicKey import RSA
from Crypto.Util.number import long_to_bytes
import jwt

from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Universal CORS configuration for Vercel, BurpSuite, and cURL
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = make_response()
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        res.headers["Access-Control-Allow-Headers"] = "*"
        return res

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

DB_NAME = Config.DB_NAME

CBC_KEY = os.urandom(16)
ECB_KEY = os.urandom(16)
PADDING_ORACLE_KEY = os.urandom(16)
STREAM_KEY = os.urandom(16)
STREAM_NONCE = os.urandom(8)
HASH_SECRET = b"AICDA_MD5_SECRET"

RSA_KEY = RSA.generate(2048, e=3)
RSA_PUB_PEM = RSA_KEY.publickey().export_key().decode()
RSA_PRIV_PEM = RSA_KEY.export_key().decode()

PBKDF2_SALT = b"AICDA_STATIC_SALT_CORE"
PBKDF2_PASS = b"cyberguard"
PBKDF2_KEY = hashlib.pbkdf2_hmac('sha1', PBKDF2_PASS, PBKDF2_SALT, 100)
CIPHER_FLAG10 = AES.new(PBKDF2_KEY[:16], AES.MODE_ECB).encrypt(pad(Config.FLAGS[10].encode(), 16)).hex()

TIMING_SECRET_PIN = "74910823"
ACTIVE_PRNG_TOKENS = {}

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_name TEXT,
                    level INTEGER,
                    flag TEXT,
                    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_name, level)
                )''')
    c.execute('''CREATE TABLE IF NOT EXISTS students (
                    name TEXT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "academy": "AICDA — Anonymous India Cyber Defence Academy",
        "service": "Production Cryptography Pentesting Engine"
    })

@app.route('/api/v1/register-student', methods=['POST', 'OPTIONS'])
def register_student():
    data = request.json or {}
    student_name = (data.get('student_name') or '').strip()
    if not student_name:
        return jsonify({"status": "error", "message": "Student name is required."}), 400

    conn = get_db()
    c = conn.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    try:
        c.execute("INSERT OR IGNORE INTO students (name, created_at, last_active) VALUES (?, ?, ?)", 
                  (student_name, now, now))
        c.execute("UPDATE students SET last_active = ? WHERE name = ?", (now, student_name))
        conn.commit()
    finally:
        conn.close()
    return jsonify({"status": "registered", "student_name": student_name})

@app.route('/api/v1/submit-flag', methods=['POST', 'OPTIONS'])
def submit_flag():
    data = request.json or {}
    student_name = (data.get('student_name') or '').strip()
    try:
        level = int(data.get('level'))
    except (ValueError, TypeError):
        return jsonify({"correct": False, "message": "Invalid level specified."}), 400
    
    submitted_flag = (data.get('flag') or '').strip()
    if not student_name:
        return jsonify({"correct": False, "message": "Student name is required."}), 400

    expected_flag = Config.FLAGS.get(level)
    if not expected_flag:
        return jsonify({"correct": False, "message": "Unknown level."}), 400

    if submitted_flag == expected_flag:
        conn = get_db()
        c = conn.cursor()
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        try:
            c.execute("INSERT OR IGNORE INTO students (name, created_at, last_active) VALUES (?, ?, ?)", 
                      (student_name, now, now))
            c.execute("UPDATE students SET last_active = ? WHERE name = ?", (now, student_name))
            c.execute("INSERT OR REPLACE INTO submissions (student_name, level, flag, solved_at) VALUES (?, ?, ?, ?)", 
                      (student_name, level, submitted_flag, now))
            conn.commit()
        finally:
            conn.close()

        return jsonify({
            "correct": True,
            "level": level,
            "points": 100,
            "message": f"SYSTEM COMPROMISED: Level {level} PWNED!"
        })
    else:
        return jsonify({"correct": False, "message": "ACCESS DENIED: Invalid flag token."}), 400

@app.route('/api/v1/reset-progress', methods=['POST', 'OPTIONS'])
def reset_progress():
    data = request.json or {}
    student_name = (data.get('student_name') or '').strip()
    reset_all = data.get('reset_all', False)
    admin_key = data.get('admin_key', '')

    conn = get_db()
    c = conn.cursor()
    try:
        if reset_all:
            if admin_key != 'AICDAadmin':
                return jsonify({"status": "error", "message": "Unauthorized"}), 403
            c.execute("DELETE FROM submissions")
            c.execute("DELETE FROM students")
            conn.commit()
            return jsonify({"status": "success", "message": "All operative progress wiped."})
        elif student_name:
            c.execute("DELETE FROM submissions WHERE student_name = ?", (student_name,))
            conn.commit()
            return jsonify({"status": "success", "message": f"Progress reset for operative {student_name}."})
        else:
            return jsonify({"status": "error", "message": "Target student name required"}), 400
    finally:
        conn.close()

@app.route('/api/v1/user-progress', methods=['GET'])
def user_progress():
    student_name = request.args.get('student_name', '').strip()
    if not student_name:
        return jsonify({"solved": []})
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT level FROM submissions WHERE student_name = ?", (student_name,))
    solved = [row['level'] for row in c.fetchall()]
    conn.close()
    return jsonify({"student_name": student_name, "solved": solved})

@app.route('/api/v1/leaderboard', methods=['GET'])
def leaderboard():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT 
            s.name, 
            s.last_active,
            COUNT(sub.level) as flags_solved,
            GROUP_CONCAT(sub.level) as flags_list,
            MAX(sub.solved_at) as last_solve_time
        FROM students s
        LEFT JOIN submissions sub ON s.name = sub.student_name
        GROUP BY s.name
        ORDER BY flags_solved DESC, last_solve_time ASC
    ''')
    rows = c.fetchall()
    conn.close()

    leaderboard_data = []
    for rank, row in enumerate(rows, start=1):
        flags_array = [int(x) for x in row['flags_list'].split(',')] if row['flags_list'] else []
        leaderboard_data.append({
            "rank": rank,
            "name": row['name'],
            "flagsSolved": row['flags_solved'],
            "flagsList": sorted(flags_array),
            "score": row['flags_solved'] * 100,
            "lastActive": row['last_active'],
            "lastSolveTime": row['last_solve_time'] or "N/A"
        })
    return jsonify({"leaderboard": leaderboard_data})

# --- Lab 1: AES-CBC Bit-Flipping ---
@app.route('/api/v1/cbc/cookie', methods=['GET'])
def cbc_get_cookie():
    iv = os.urandom(16)
    plaintext = b"role=user;data=x" + b"auth=false;sess="
    cipher = AES.new(CBC_KEY, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(plaintext)
    token = (iv + ciphertext).hex()
    resp = make_response(jsonify({"status": "cookie_assigned", "token": token}))
    resp.set_cookie('auth_session', token)
    return resp

@app.route('/api/v1/cbc/admin', methods=['POST', 'OPTIONS'])
def cbc_admin():
    data = request.json or {}
    token_hex = data.get('token') or request.cookies.get('auth_session')
    if not token_hex:
        return jsonify({"error": "Missing auth_session token"}), 400
    try:
        raw = bytes.fromhex(token_hex)
        iv = raw[:16]
        ct = raw[16:]
        cipher = AES.new(CBC_KEY, AES.MODE_CBC, iv)
        pt = cipher.decrypt(ct)
    except Exception as e:
        return jsonify({"error": "Decryption failed", "detail": str(e)}), 400

    if b"role=admn" in pt:
        return jsonify({"access": "granted", "role": "admn", "flag": Config.FLAGS[1]})
    return jsonify({"access": "denied", "plaintext": pt.decode(errors='ignore'), "message": "Only role=admn is authorized"}), 403

# --- Lab 2: Padding Oracle ---
@app.route('/api/v1/padding-oracle/token', methods=['GET'])
def padding_oracle_token():
    iv = os.urandom(16)
    secret_payload = f"uid=1337&secret={Config.FLAGS[2]}".encode()
    cipher = AES.new(PADDING_ORACLE_KEY, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(secret_payload, 16))
    return jsonify({"token": (iv + ct).hex()})

@app.route('/api/v1/padding-oracle/decrypt', methods=['POST', 'OPTIONS'])
def padding_oracle_decrypt():
    data = request.json or {}
    token_hex = data.get('ciphertext')
    if not token_hex:
        return jsonify({"error": "Missing ciphertext"}), 400
    try:
        raw = bytes.fromhex(token_hex)
        iv = raw[:16]
        ct = raw[16:]
        cipher = AES.new(PADDING_ORACLE_KEY, AES.MODE_CBC, iv)
        decrypted = cipher.decrypt(ct)
        unpad(decrypted, 16)
        return jsonify({"status": "valid_padding", "auth": True})
    except ValueError:
        return jsonify({"status": "error", "message": "PKCS#7 padding error: invalid padding bytes"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# --- Lab 3: AES-ECB Byte-at-a-Time ---
@app.route('/api/v1/ecb/encrypt', methods=['POST', 'OPTIONS'])
def ecb_encrypt():
    data = request.json or {}
    user_input = (data.get('data') or '').encode()
    combined = user_input + Config.FLAGS[3].encode()
    cipher = AES.new(ECB_KEY, AES.MODE_ECB)
    ct = cipher.encrypt(pad(combined, 16))
    return jsonify({"ciphertext": ct.hex()})

# --- Lab 4: Stream Cipher Nonce Reuse ---
@app.route('/api/v1/nonce-reuse/transmissions', methods=['GET'])
def nonce_reuse_transmissions():
    p1 = b"AICDA-SEC-DIRECTIVE: System maintenance scheduled for Sunday at 00:00 UTC."
    p2 = f"AICDA-TOP-SECRET: Master authorization flag is {Config.FLAGS[4]}".encode()

    def xor_bytes(msg, key, nonce):
        cipher = AES.new(key, AES.MODE_CTR, nonce=nonce)
        return cipher.encrypt(msg)

    c1 = xor_bytes(p1, STREAM_KEY, STREAM_NONCE)
    c2 = xor_bytes(p2, STREAM_KEY, STREAM_NONCE)
    return jsonify({"p1_known_plaintext": p1.decode(), "c1_hex": c1.hex(), "c2_hex": c2.hex()})

# --- Lab 5: PRNG Predictability ---
@app.route('/api/v1/prng/request-reset', methods=['POST', 'OPTIONS'])
def prng_request_reset():
    data = request.json or {}
    username = data.get('username')
    if username != 'admin':
        return jsonify({"error": "Reset only supported for admin in this lab"}), 400

    server_time = int(time.time())
    random.seed(server_time)
    token = hex(random.getrandbits(128))[2:].zfill(32)
    ACTIVE_PRNG_TOKENS[token] = server_time + 300

    resp = make_response(jsonify({
        "message": "Password reset token dispatched.",
        "server_time": server_time
    }))
    resp.headers['X-Server-Timestamp'] = str(server_time)
    return resp

@app.route('/api/v1/prng/verify-reset', methods=['POST', 'OPTIONS'])
def prng_verify_reset():
    data = request.json or {}
    token = data.get('token')
    if token in ACTIVE_PRNG_TOKENS:
        del ACTIVE_PRNG_TOKENS[token]
        return jsonify({"status": "success", "message": "Admin password reset successfully.", "flag": Config.FLAGS[5]})
    return jsonify({"status": "denied", "message": "Invalid or expired reset token"}), 403

# --- Lab 6: Hash Length Extension ---
@app.route('/api/v1/hash-extension/generate', methods=['GET'])
def hash_extension_generate():
    data = "user=guest&role=viewer"
    sig = hashlib.md5(HASH_SECRET + data.encode()).hexdigest()
    return jsonify({"data": data, "sig": sig, "secret_length_bytes": len(HASH_SECRET)})

@app.route('/api/v1/hash-extension/verify', methods=['GET'])
def hash_extension_verify():
    data_raw = request.args.get('data', '').encode('latin1')
    provided_sig = request.args.get('sig', '')
    expected_sig = hashlib.md5(HASH_SECRET + data_raw).hexdigest()

    if hmac.compare_digest(provided_sig, expected_sig):
        if b"role=admin" in data_raw or b"role=administrator" in data_raw:
            return jsonify({"access": "granted", "message": "Signature verified! Elevated to admin.", "flag": Config.FLAGS[6]})
        return jsonify({"access": "granted", "message": "Signature valid, standard guest role."})
    return jsonify({"access": "denied", "message": "Signature mismatch"}), 403

# --- Lab 7: JWT Algorithm Confusion & None ---
@app.route('/api/v1/jwt/public-key', methods=['GET'])
def jwt_public_key():
    return jsonify({"public_key": RSA_PUB_PEM})

@app.route('/api/v1/jwt/token', methods=['GET'])
def jwt_get_token():
    payload = {"user": "analyst", "role": "standard", "exp": int(time.time()) + 3600}
    token = jwt.encode(payload, RSA_PRIV_PEM, algorithm="RS256")
    return jsonify({"token": token})

@app.route('/api/v1/jwt/admin-dashboard', methods=['POST', 'OPTIONS'])
def jwt_admin_dashboard():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        return jsonify({"error": "Missing token"}), 400

    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get('alg', '').lower()

        if alg == 'none':
            decoded = jwt.decode(token, options={"verify_signature": False})
        elif alg == 'hs256':
            decoded = jwt.decode(token, RSA_PUB_PEM, algorithms=["HS256"])
        else:
            decoded = jwt.decode(token, RSA_PUB_PEM, algorithms=["RS256"])

        if decoded.get('role') == 'admin':
            return jsonify({"status": "authorized", "role": "admin", "flag": Config.FLAGS[7]})
        return jsonify({"status": "denied", "role": decoded.get('role')}), 403
    except Exception as e:
        return jsonify({"error": f"JWT Validation Failed: {str(e)}"}), 400

# --- Lab 8: Bleichenbacher RSA e=3 ---
@app.route('/api/v1/rsa/params', methods=['GET'])
def rsa_params():
    return jsonify({"e": RSA_KEY.e, "n": hex(RSA_KEY.n), "keysize_bits": 2048})

@app.route('/api/v1/rsa/verify', methods=['POST', 'OPTIONS'])
def rsa_verify():
    data = request.json or {}
    msg = data.get('message', '').encode()
    sig_hex = data.get('signature', '')
    if not msg or not sig_hex:
        return jsonify({"error": "Missing message or signature"}), 400

    try:
        s = int(sig_hex, 16)
        m_int = pow(s, RSA_KEY.e, RSA_KEY.n)
        m_bytes = long_to_bytes(m_int, 256)

        asn1_sha256 = b"\x30\x31\x30\x0d\x06\x09\x60\x86\x48\x01\x65\x03\x04\x02\x01\x05\x00\x04\x20"
        digest = hashlib.sha256(msg).digest()

        if m_bytes.startswith(b"\x00\x01\xff") and (b"\x00" + asn1_sha256 + digest) in m_bytes:
            if b"admin_access=true" in msg:
                return jsonify({"verified": True, "message": "Forged signature accepted!", "flag": Config.FLAGS[8]})
            return jsonify({"verified": True, "message": "Signature valid"})
        return jsonify({"verified": False, "error": "Invalid signature prefix or digest"}), 400
    except Exception as e:
        return jsonify({"verified": False, "error": str(e)}), 400

# --- Lab 9: Timing Attack ---
@app.route('/api/v1/timing/verify-pin', methods=['POST', 'OPTIONS'])
def timing_verify_pin():
    data = request.json or {}
    supplied_pin = data.get('pin', '')
    if len(supplied_pin) != len(TIMING_SECRET_PIN):
        return jsonify({"status": "invalid_length", "required_length": len(TIMING_SECRET_PIN)}), 400

    match = True
    for c1, c2 in zip(supplied_pin, TIMING_SECRET_PIN):
        if c1 == c2:
            time.sleep(0.025)
        else:
            match = False
            break

    if match:
        return jsonify({"status": "authenticated", "flag": Config.FLAGS[9]})
    return jsonify({"status": "denied", "message": "Incorrect PIN"}), 403

# --- Lab 10: Flawed PBKDF2 ---
@app.route('/api/v1/pbkdf2/vault-dump', methods=['GET'])
def pbkdf2_vault_dump():
    return jsonify({
        "vault_user": "operator_backup",
        "kdf": "PBKDF2-HMAC-SHA1",
        "iterations": 100,
        "salt": PBKDF2_SALT.decode(),
        "hash": PBKDF2_KEY.hex(),
        "encrypted_vault_flag": CIPHER_FLAG10
    })

@app.route('/api/v1/pbkdf2/unlock', methods=['POST', 'OPTIONS'])
def pbkdf2_unlock():
    data = request.json or {}
    passphrase = (data.get('passphrase') or '').encode()
    derived = hashlib.pbkdf2_hmac('sha1', passphrase, PBKDF2_SALT, 100)
    if hmac.compare_digest(derived, PBKDF2_KEY):
        cipher = AES.new(derived[:16], AES.MODE_ECB)
        flag = unpad(cipher.decrypt(bytes.fromhex(CIPHER_FLAG10)), 16).decode()
        return jsonify({"status": "unlocked", "flag": flag})
    return jsonify({"status": "denied", "message": "Invalid passphrase"}), 403

if __name__ == '__main__':
    port = int(os.environ.get('PORT', Config.PORT))
    app.run(host=Config.HOST, port=port, debug=Config.DEBUG)

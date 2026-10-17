import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'AICDA_SUPER_SECRET_CORE_KEY')
    DEBUG = False
    PORT = 8080
    HOST = '0.0.0.0'
    DB_NAME = 'crypto_ctf.db'
    
    FLAGS = {
        1: "flag{cbc_b1t_fl1pp1ng_m4c_0m1ss10n}",
        2: "flag{pkcs7_p4dd1ng_0r4cl3_d3crypt3d}",
        3: "flag{3cb_byt3_4t_a_t1m3_d3crypt10n}",
        4: "flag{gcm_ctr_n0nc3_r3us3_k3ystr34m_x0r}",
        5: "flag{prng_s33d_t1m3st4mp_pr3d1ct4bl3}",
        6: "flag{h4sh_l3ngth_3xt3ns10n_md5_fl4w}",
        7: "flag{jwt_4lg_n0n3_4nd_k3y_c0nfus10n}",
        8: "flag{bl31ch3nb4ch3r_sm4ll_3_f0rg3ry}",
        9: "flag{t1m1ng_4tt4ck_s1d3_ch4nn3l_l34k}",
        10: "flag{pbkdf2_w34k_kdf_h4shc4t_cr4ck3d}"
    }

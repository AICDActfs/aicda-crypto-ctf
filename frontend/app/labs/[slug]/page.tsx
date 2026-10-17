'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import MatrixRain from '../../../components/MatrixRain';
import TerminalBlock from '../../../components/TerminalBlock';

const LAB_DATA: Record<string, {
  level: number;
  title: string;
  category: string;
  theory: string[];
  steps: string[];
  targetEndpoint: string;
  sampleCommand: string;
  objective: string;
}> = {
  'cbc-bit-flipping': {
    level: 1,
    title: 'AES-CBC Bit-Flipping Attack',
    category: 'BLOCK CIPHER MALLEABILITY',
    theory: [
      "In Cipher Block Chaining (CBC) mode, decryption of block i is performed as: P_i = D_K(C_i) ⊕ C_{i-1}.",
      "Because the ciphertext block C_{i-1} is directly XORed against the output of the block cipher to yield P_i, modifying byte j of C_{i-1} creates an exact, predictable bit change in plaintext byte P_i[j]: P'_i[j] = P_i[j] ⊕ (C_{i-1}[j] ⊕ C'_{i-1}[j]).",
      "While block i-1 is scrambled into pseudo-random garbage during this process, block i flips to the exact desired target string without knowing the AES master key.",
      "Enterprise Flaw: The application relies on encrypted cookies without an HMAC or Authenticated Encryption (EtM / GCM)."
    ],
    steps: [
      "1. Retrieve the encrypted session cookie from /api/v1/cbc/cookie.",
      "2. Identify the target block offset containing 'role=user'.",
      "3. Compute the bitmask difference between 'user' and 'admn'.",
      "4. Flip the corresponding byte in the previous block (or IV) and submit to /api/v1/cbc/admin."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/cbc/admin",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/cbc/admin -H 'Content-Type: application/json' -d '{\"token\":\"<MODIFIED_HEX>\"}'",
    objective: "Elevate your session privileges from role=user to role=admn via ciphertext bit manipulation."
  },
  'padding-oracle': {
    level: 2,
    title: 'PKCS#7 Padding Oracle Exploit',
    category: 'SIDE-CHANNEL ERROR ORACLE',
    theory: [
      "PKCS#7 pads blocks to 16 bytes. If N bytes of padding are required, the byte value N is repeated N times.",
      "A padding oracle arises when a server distinguishes between invalid padding and invalid application payload through error codes or timing.",
      "By manipulating the last byte of C_{i-1} across 256 possibilities and observing when the server reports valid padding (0x01), an attacker decrypts byte-by-byte from right to left."
    ],
    steps: [
      "1. Obtain the encrypted token containing confidential data from /api/v1/padding-oracle/token.",
      "2. Write a Python script targeting /api/v1/padding-oracle/decrypt.",
      "3. Test 0x00 through 0xFF on the penultimate block to discover the valid padding byte.",
      "4. Iterate through all blocks to recover the full plaintext and flag."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/padding-oracle/decrypt",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/padding-oracle/decrypt -H 'Content-Type: application/json' -d '{\"ciphertext\":\"<HEX>\"}'",
    objective: "Decrypt the ciphertext without the AES key by querying the server's PKCS#7 error response."
  },
  'ecb-byte-at-a-time': {
    level: 3,
    title: 'AES-ECB Byte-at-a-Time Chosen-Plaintext Attack',
    category: 'BLOCK ALIGNMENT LEAK',
    theory: [
      "Electronic Codebook (ECB) encrypts each 16-byte block independently with the exact same key. Identical plaintext blocks produce identical ciphertext blocks.",
      "When user input is prepended to a secret flag before encryption: Block = (User_Input + Flag), an attacker can align bytes by controlling the length of User_Input.",
      "By sending 15 bytes of padding ('A'*15), the first byte of the flag is pushed into the 16th byte of the first block.",
      "The attacker computes a 256-entry lookup dictionary of ('A'*15 + char) and matches the ciphertext block to recover the flag character."
    ],
    steps: [
      "1. Query /api/v1/ecb/encrypt with crafted payloads of descending length (15, 14, 13...).",
      "2. For each byte offset, query all printable characters (0x20 to 0x7E) to build dictionary blocks.",
      "3. Match ciphertext blocks to reconstruct the flag character by character."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/ecb/encrypt",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/ecb/encrypt -H 'Content-Type: application/json' -d '{\"data\":\"AAAAAAAAAAAAAAA\"}'",
    objective: "Extract the secret flag appended to your input by aligning plaintext blocks under AES-ECB."
  },
  'nonce-reuse': {
    level: 4,
    title: 'Stream Cipher Nonce Reuse Attack',
    category: 'KEYSTREAM ELIMINATION',
    theory: [
      "Stream ciphers (ChaCha20, AES-CTR) generate a pseudorandom keystream KS from a Key and Nonce: C = P ⊕ KS.",
      "If the same Nonce is reused across two distinct messages: C_1 = P_1 ⊕ KS and C_2 = P_2 ⊕ KS.",
      "XORing both ciphertexts completely eliminates the keystream: C_1 ⊕ C_2 = P_1 ⊕ P_2.",
      "If any plaintext P_1 is known (such as a standard protocol header or broadcast message), P_2 is recovered trivially: P_2 = C_1 ⊕ C_2 ⊕ P_1."
    ],
    steps: [
      "1. Retrieve the two transmissions and the known plaintext P1 from /api/v1/nonce-reuse/transmissions.",
      "2. Convert C1 and C2 from hex into raw byte arrays.",
      "3. Compute P2 = bytes_xor(bytes_xor(C1, C2), P1).",
      "4. Parse the recovered ASCII string to obtain the secret flag."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/nonce-reuse/transmissions",
    sampleCommand: "curl -s http://localhost:8080/api/v1/nonce-reuse/transmissions",
    objective: "Eliminate the keystream via XOR cancellation to recover confidential command transmission P2."
  },
  'prng-predictability': {
    level: 5,
    title: 'PRNG Predictability & Token Hijack',
    category: 'UNSEEDED PSEUDORANDOM GENERATOR',
    theory: [
      "Standard library random generators (like Python's random / MT19937) are deterministic and mathematically predictable.",
      "When initialized with time.time(), the seed space for any given second is exactly 1.",
      "Enterprise Flaw: Developers frequently use random.seed(int(time.time())) for password reset tokens instead of secrets.token_hex() or os.urandom().",
      "An attacker reads the HTTP Date response header to replicate the seed and generate the identical reset token."
    ],
    steps: [
      "1. Request an admin password reset at /api/v1/prng/request-reset.",
      "2. Record the server timestamp returned in the header or payload.",
      "3. Run a local Python script seeding random.seed(timestamp) to generate the 128-bit hex token.",
      "4. Submit the token to /api/v1/prng/verify-reset to claim the admin account."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/prng/verify-reset",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/prng/request-reset -H 'Content-Type: application/json' -d '{\"username\":\"admin\"}'",
    objective: "Predict the administrator password reset token by synchronizing with the server's PRNG timestamp."
  },
  'hash-length-extension': {
    level: 6,
    title: 'Hash Length Extension Attack (MD5)',
    category: 'MERKLE-DAMGÅRD CONSTRUCTION',
    theory: [
      "Merkle-Damgård hash functions (MD5, SHA-1, SHA-256) process input in sequential blocks where the output of block i serves as the internal state for block i+1.",
      "When an application authenticates messages using H(Secret || Message), an attacker knowing H(Secret || Message) already possesses the internal register state after processing the original data.",
      "Without knowing Secret, the attacker appends MD5 padding and arbitrary unauthorized parameters (&role=admin) and computes the valid signature continuation."
    ],
    steps: [
      "1. Fetch the guest token and valid MD5 signature from /api/v1/hash-extension/generate.",
      "2. Note the secret key length (16 bytes).",
      "3. Use hashpump or custom Python script to append '&role=admin' to the message.",
      "4. Submit the extended payload and newly derived signature to /api/v1/hash-extension/verify."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/hash-extension/verify",
    sampleCommand: "curl -s 'http://localhost:8080/api/v1/hash-extension/generate'",
    objective: "Append admin privileges to an authenticated session without knowing the backend secret key."
  },
  'jwt-algorithm-confusion': {
    level: 7,
    title: 'JWT None & Key Confusion Attack',
    category: 'ASYMMETRIC TO SYMMETRIC CONFUSION',
    theory: [
      "Vulnerability A (alg: none): Flawed JWT libraries allow tokens with {\"alg\": \"none\"} to bypass signature checks.",
      "Vulnerability B (RS256 -> HS256): The server expects an RS256 token signed by a private RSA key. If the attacker changes the header to {\"alg\": \"HS256\"}, naive verification code verifies the token using HMAC-SHA256 with the server's public key certificate as the HMAC secret key."
    ],
    steps: [
      "1. Inspect public key at /api/v1/jwt/public-key.",
      "2. Forge a JWT payload with {\"user\": \"analyst\", \"role\": \"admin\"}.",
      "3. Sign the token using HMAC-SHA256 with the exact RSA public key PEM string as the secret (or test alg: none).",
      "4. Submit token as Bearer header to /api/v1/jwt/admin-dashboard."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/jwt/admin-dashboard",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/jwt/admin-dashboard -H 'Authorization: Bearer <TOKEN>'",
    objective: "Bypass signature validation using algorithm confusion or unsigned tokens to elevate to admin."
  },
  'bleichenbacher-rsa': {
    level: 8,
    title: 'Bleichenbacher RSA e=3 Signature Forgery',
    category: 'LOW PUBLIC EXPONENT FORGERY',
    theory: [
      "In PKCS#1 v1.5, a signed hash is padded as: 00 01 FF FF ... FF 00 [ASN.1 DigestInfo] [Hash].",
      "When e=3, verification computes: M = S^3 mod N.",
      "If the verification function only checks that M starts with 00 01 FF and contains the correct digest without verifying that FF padding occupies the entire 2048-bit buffer, an attacker can place arbitrary garbage after the digest.",
      "Because S^3 < N, no modular wrap-around occurs. The attacker crafts the prefix and computes the integer cube root S = ⌈D^(1/3)⌉."
    ],
    steps: [
      "1. Retrieve modulus N and e=3 from /api/v1/rsa/params.",
      "2. Construct the forged byte array: 00 01 FF ... 00 [ASN.1] [SHA256('admin_access=true')] [GARBAGE].",
      "3. Compute the integer cube root of this value.",
      "4. Submit the hex signature to /api/v1/rsa/verify."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/rsa/verify",
    sampleCommand: "curl -s -X POST http://localhost:8080/api/v1/rsa/verify -H 'Content-Type: application/json' -d '{\"message\":\"admin_access=true\",\"signature\":\"<HEX>\"}'",
    objective: "Forge a valid digital signature on administrative parameters using small public exponent cube roots."
  },
  'timing-attack': {
    level: 9,
    title: 'Microsecond Timing Attack on Secret Comparison',
    category: 'SIDE-CHANNEL TIMING LEAK',
    theory: [
      "Standard string equality ('a' == 'b') terminates early on the first mismatched character.",
      "When checking security credentials without constant-time comparison (e.g. hmac.compare_digest), each correct character adds processing latency.",
      "An attacker measures HTTP round-trip latency across candidates ('0' through '9'). The character yielding the longest latency is confirmed correct."
    ],
    steps: [
      "1. Target endpoint /api/v1/timing/verify-pin.",
      "2. Write a Python script to iterate through positions 0 to 7.",
      "3. For each candidate character, record request duration. Select the outlier character with the highest latency.",
      "4. Repeat until all 8 PIN digits are recovered."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/timing/verify-pin",
    sampleCommand: "curl -s -w '\\nTime: %{time_total}s\\n' -X POST http://localhost:8080/api/v1/timing/verify-pin -H 'Content-Type: application/json' -d '{\"pin\":\"70000000\"}'",
    objective: "Recover the secret authentication PIN digit-by-digit using microsecond timing differences."
  },
  'weak-pbkdf2': {
    level: 10,
    title: 'Flawed PBKDF2 & Static Salt Cracking',
    category: 'KEY DERIVATION AUDITING',
    theory: [
      "PBKDF2 applies a pseudorandom function repeatedly to increase hash computation cost (NIST recommends at least 600,000 iterations for PBKDF2-HMAC-SHA256).",
      "Enterprise Flaw: Legacy password vaults often use outdated algorithms (PBKDF2-HMAC-SHA1), inadequate iteration counts (100 iterations), and hardcoded global salts.",
      "With iterations=100, an attacker can compute millions of candidates per second using Hashcat or John the Ripper to crack the vault key."
    ],
    steps: [
      "1. Download the vault dump from /api/v1/pbkdf2/vault-dump.",
      "2. Extract the salt, iteration count (100), and target hash.",
      "3. Crack the hash with a standard dictionary attack (rockyou.txt or wordlist).",
      "4. Submit the recovered passphrase to /api/v1/pbkdf2/unlock to decrypt the master flag."
    ],
    targetEndpoint: "http://localhost:8080/api/v1/pbkdf2/unlock",
    sampleCommand: "curl -s http://localhost:8080/api/v1/pbkdf2/vault-dump",
    objective: "Extract the low-work-factor PBKDF2 hash, crack the passphrase, and unlock the encrypted vault flag."
  }
};

export default function LabSubPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [activeTab, setActiveTab] = useState<'theory' | 'steps' | 'objective'>('theory');

  const lab = LAB_DATA[slug] || {
    level: 0,
    title: 'Unknown Lab Target',
    category: 'CRYPTOGRAPHY',
    theory: ['Target protocol specification not found in mainframe database.'],
    steps: ['Return to the dashboard to select a valid challenge.'],
    targetEndpoint: 'N/A',
    sampleCommand: 'curl http://localhost:8080/health',
    objective: 'Select an active lab.'
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      <MatrixRain />
      <Header />

      <main className="max-w-4xl mx-auto w-full px-4 pt-6 flex-1">
        <Link 
          href="/labs" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-matrix-green hover:text-white mb-6 transition-colors"
        >
          ← RETURN TO MAINFRAME DASHBOARD
        </Link>

        <div className="glass-card p-5 sm:p-8 rounded-lg mb-8">
          <div className="border-b border-matrix-green/30 pb-4 mb-6">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-matrix-green/10 text-matrix-light border border-matrix-green/30">
              {lab.category}
            </span>
            <h1 className="text-xl sm:text-3xl font-bold glitch mt-2">
              Level {lab.level}: {lab.title}
            </h1>
          </div>

          <div className="flex flex-wrap border-b border-matrix-green/30 mb-6 gap-1">
            <button 
              onClick={() => setActiveTab('theory')}
              className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-t transition-all ${
                activeTab === 'theory' 
                  ? 'bg-matrix-green text-black' 
                  : 'text-matrix-green hover:bg-matrix-green/10'
              }`}
            >
              📖 ARCHITECTURE & THEORY
            </button>
            <button 
              onClick={() => setActiveTab('steps')}
              className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-t transition-all ${
                activeTab === 'steps' 
                  ? 'bg-matrix-green text-black' 
                  : 'text-matrix-green hover:bg-matrix-green/10'
              }`}
            >
              🎯 ATTACK METHODOLOGY
            </button>
            <button 
              onClick={() => setActiveTab('objective')}
              className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-t transition-all ${
                activeTab === 'objective' 
                  ? 'bg-matrix-green text-black' 
                  : 'text-matrix-green hover:bg-matrix-green/10'
              }`}
            >
              🏁 OBJECTIVE & ENDPOINTS
            </button>
          </div>

          <div className="min-h-[220px] text-gray-300 text-xs sm:text-sm leading-relaxed">
            {activeTab === 'theory' && (
              <div className="space-y-4">
                {lab.theory.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {lab.steps.map((step, i) => (
                    <div key={i} className="p-2.5 bg-black/60 rounded border border-matrix-green/20 font-mono text-xs">
                      {step}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-mono text-matrix-light mb-1">SAMPLE TARGET CLI PROBE:</p>
                  <TerminalBlock command={lab.sampleCommand} />
                </div>
              </div>
            )}

            {activeTab === 'objective' && (
              <div className="space-y-4">
                <div className="p-4 bg-matrix-green/10 border border-matrix-green/40 rounded">
                  <p className="font-bold text-white mb-1">MISSION DIRECTIVE:</p>
                  <p>{lab.objective}</p>
                </div>
                <div className="p-3 bg-black/60 rounded border border-matrix-green/20">
                  <span className="text-xs text-matrix-light font-mono block mb-1">VULNERABLE API TARGET:</span>
                  <code className="text-xs font-mono text-matrix-green break-all">{lab.targetEndpoint}</code>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  ACCEPTED FLAG FORMAT: <span className="text-matrix-green">flag&#123;...&#125;</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Controller.js
let peer = null;
let conn = null;
let call = null;
let targetId = null;
let remoteVideo = document.getElementById('remoteVideo');
let logDiv = document.getElementById('log');
let connStatus = document.getElementById('connStatus');
let locationDiv = document.getElementById('locationResult');

function addLog(msg, isError = false) {
    let d = document.createElement('div');
    d.innerHTML = `❯ ${msg}`;
    if (isError) d.style.color = '#f88';
    logDiv.appendChild(d);
    logDiv.scrollTop = logDiv.scrollHeight;
    console.log(msg);
}

// Inisialisasi peer
peer = new Peer({
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});
peer.on('open', id => addLog(`Controller ID: ${id}`));
peer.on('error', err => addLog(`Peer error: ${err.message}`, true));

document.getElementById('connectBtn').onclick = () => {
    let code = document.getElementById('targetCode').value.trim();
    if (!code || code.length !== 6) {
        alert('Masukkan kode 6 digit dari target!');
        return;
    }
    targetId = code;
    addLog(`Menghubungi target ${targetId}...`);

    // Data channel
    conn = peer.connect(targetId);
    conn.on('open', () => {
        addLog('Data channel terbuka!');
        connStatus.innerText = '✅ Terhubung';
        connStatus.style.background = '#0f0';
        setupDataChannel();
    });
    conn.on('error', err => addLog(`Data error: ${err.message}`, true));

    // Video call
    call = peer.call(targetId, null);
    call.on('stream', stream => {
        addLog('📹 Video stream dari target diterima');
        remoteVideo.srcObject = stream;
    });
    call.on('error', err => addLog(`Call error: ${err.message}`, true));
};

function setupDataChannel() {
    conn.on('data', (data) => {
        if (data.type === 'location') {
            locationDiv.innerHTML = `<strong>📍 Lokasi Target:</strong><br>Lat: ${data.lat}, Lng: ${data.lng}<br>
            <a href="https://www.google.com/maps?q=${data.lat},${data.lng}" target="_blank">Buka di Google Maps</a>`;
            addLog(`Lokasi diterima: ${data.lat}, ${data.lng}`);
        } else if (data.type === 'log') {
            addLog(`[Target] ${data.msg}`);
        } else if (data.type === 'error') {
            addLog(`Error target: ${data.msg}`, true);
        }
    });
}

function sendCommand(cmd) {
    if (conn && conn.open) {
        conn.send({ type: 'command', cmd: cmd });
        addLog(`📤 Perintah dikirim: ${cmd}`);
    } else {
        addLog('Tidak terhubung ke target!', true);
    }
}

document.getElementById('flashBtn').onclick = () => sendCommand('toggleFlash');
document.getElementById('locBtn').onclick = () => sendCommand('getLocation');
document.getElementById('sosBtn').onclick = () => sendCommand('sos');
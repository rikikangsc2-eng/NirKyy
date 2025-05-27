const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const axios = require('axios');

process.on('uncaughtException', (error) => {
    console.error('KESALAHAN TIDAK TERTANGKAP! 💥 Mematikan...');
    console.error('Kesalahan:', error.name, error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('PENOLAKAN PROMISE TIDAK TERTANGKAP! 💥 Mematikan...');
    console.error('Promise:', promise);
    console.error('Alasan:', reason.name || reason, reason.message || '');
    console.error('Stack:', reason.stack || 'Tidak ada stack tersedia');
});

const app = express();
const port = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');
const ENDPOINTS_FILE = path.join(__dirname, 'list.json');
const API_DIR = path.join(__dirname, 'API');

let dataJson = {
    daftarTags: [],
    fitur: []
};
try {
    const rawData = fs.readFileSync(ENDPOINTS_FILE, 'utf-8');
    dataJson = JSON.parse(rawData);
} catch (err) {
    console.error(`Gagal membaca atau mengurai berkas endpoint (${ENDPOINTS_FILE}):`, err.message);
}

const endpoints = dataJson.fitur || [];
const daftarTags = dataJson.daftarTags || [];

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'Terlalu banyak permintaan, silakan coba lagi setelah beberapa menit.',
    standardHeaders: true,
    legacyHeaders: false,
});

const counterMiddleware = (req, res, next) => {
    axios.get('https://copper-ambiguous-velvet.glitch.me/up', {
            timeout: 5000
        })
        .catch(error => {
            console.error('Gagal mengirim permintaan untuk penghitung:', error.message);
        });
    next();
};

app.set('trust proxy', 1);
app.use(apiLimiter);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});

app.use("/api/v1", counterMiddleware);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set('json spaces', 2);

app.use((req, res, next) => {
     res.succesJson = (data, statusCode = 200) => res.status(statusCode).json({
        published_By: "NirKyy",
        success: true,
        data: data
    });
    res.successJson = (data, statusCode = 200) => res.status(statusCode).json({
        published_By: "NirKyy",
        success: true,
        data: data
    });
    res.errorJson = (message, statusCode = 500) => res.status(statusCode).json({
        published_By: "NirKyy",
        success: false,
        status: statusCode,
        error: message
    });
    next();
});

app.use(express.static(PUBLIC_DIR));
app.set('view engine', 'ejs');
app.set('views', VIEWS_DIR);

function getAllJsFiles(dirPath, fileList = []) {
    try {
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            console.warn(`Direktori tidak ditemukan atau bukan direktori: ${dirPath}`);
            return fileList;
        }
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            try {
                const fileStat = fs.statSync(fullPath);
                
                if (fileStat.isDirectory()) {
                    getAllJsFiles(fullPath, fileList);
                } else if (fileStat.isFile() && file.endsWith('.js') && file !== 'index.js') {
                    fileList.push(fullPath);
                }
            } catch (statErr) {
                console.error(`Kesalahan saat memeriksa status berkas/direktori ${fullPath}:`, statErr.message);
            }
        });
    } catch (readDirErr) {
        console.error(`Kesalahan saat membaca direktori ${dirPath}:`, readDirErr.message);
    }
    return fileList;
}

try {
    const apiFiles = getAllJsFiles(API_DIR);
    const mountedRoutes = new Set();
    
    apiFiles.forEach(filePath => {
        const filename = path.basename(filePath);
        const endpointName = path.parse(filename).name;
        const routePath = `/api/v1/${endpointName}`;
        let handler;
        
        if (mountedRoutes.has(routePath)) {
            console.warn(`Peringatan: Konflik rute. Rute ${routePath} dari ${path.relative(API_DIR, filePath)} akan menimpa rute yang sudah ada.`);
        }
        mountedRoutes.add(routePath);
        
        try {
            handler = require(filePath);
            if (typeof handler === 'function') {
                app.use(routePath, handler);
                console.log(`Rute ${routePath} dimuat dari ${path.relative(API_DIR, filePath)}`);
            } else {
                console.warn(`Berkas ${path.relative(API_DIR, filePath)} tidak mengekspor fungsi. Dilewati.`);
            }
        } catch (requireErr) {
            console.error(`Kesalahan saat memuat berkas rute ${path.relative(API_DIR, filePath)}:`, requireErr.message);
        }
    });
    
} catch (mainDirErr) {
    console.error(`Kesalahan saat memproses direktori API (${API_DIR}):`, mainDirErr.message);
}

function getUniqueTags(data) {
    if (!Array.isArray(data)) return [];
    const tags = new Set();
    data.forEach(ep => {
        if (ep && ep.tags && Array.isArray(ep.tags)) {
            ep.tags.forEach(tag => {
                if (tag && typeof tag === 'string') {
                    tags.add(tag.trim());
                }
            });
        }
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

const uniqueTagsFromData = getUniqueTags(endpoints);

function filterEndpoints(data, {
    term,
    tags
}) {
    let filteredData = Array.isArray(data) ? [...data] : [];
    
    if (tags) {
        const lowerTags = String(tags).toLowerCase().split(',').map(t => t.trim()).filter(t => t);
        if (lowerTags.length > 0) {
            filteredData = filteredData.filter(ep =>
                ep && ep.tags && Array.isArray(ep.tags) && ep.tags.some(tag => lowerTags.includes(String(tag).toLowerCase()))
            );
        }
    }
    
    if (term) {
        const lowerTerm = String(term).toLowerCase();
        filteredData = filteredData.filter(ep =>
            ep && (
                (ep.nama && String(ep.nama).toLowerCase().includes(lowerTerm)) ||
                (ep.endpoint && String(ep.endpoint).toLowerCase().includes(lowerTerm)) ||
                (ep.deskripsi && String(ep.deskripsi).toLowerCase().includes(lowerTerm)) ||
                (ep.tags && Array.isArray(ep.tags) && ep.tags.some(tag => String(tag).toLowerCase().includes(lowerTerm)))
            )
        );
    }
    return filteredData;
}

app.get('/', (req, res) => {
    res.render('index', {
        endpoints: endpoints,
        uniqueTags: uniqueTagsFromData
    });
});

app.get('/tags', (req, res) => {
    res.json({
        tags: uniqueTagsFromData
    });
});

app.get('/renderpage', (req, res) => {
    const {
        tags = ''
    } = req.query;
    const filtered = filterEndpoints(endpoints, {
        tags
    });
    res.json({
        endpoints: filtered
    });
});

app.get('/search', (req, res) => {
    const {
        term = ''
    } = req.query;
    const filtered = filterEndpoints(endpoints, {
        term
    });
    res.json({
        endpoints: filtered
    });
});

app.use((req, res, next) => {
    if (req.accepts('html')) {
        res.status(404).render('404');
    } else {
        res.status(404).errorJson('Sumber daya tidak ditemukan.', 404);
    }
});

app.use((err, req, res, next) => {
    console.error('PENANGAN KESALAHAN EXPRESS:', err.message);
    console.error(err.stack);
    
    if (res.headersSent) {
        return next(err);
    }
    
    const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600 ?
        err.statusCode :
        500;
    
    const errorMessage = err.message || 'Terjadi kesalahan tak terduga. Harap informasikan kepada pemilik.';
    
    if (req.accepts('html')) {
        res.status(statusCode).errorJson(errorMessage, statusCode);
    } else {
        res.status(statusCode).errorJson(errorMessage, statusCode);
    }
});

const server = app.listen(port, () => {
    console.log(`🚀 Berjalan Cuyy di PORT:${port}`);
});

const gracefulShutdown = (signal) => {
    console.log(`Sinyal ${signal} diterima. Menutup server http.`);
    server.close(() => {
        console.log('Server http ditutup.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
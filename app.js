const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const axios = require('axios');

// Error handling global
let handledGlobalError = false;
if (!handledGlobalError) {
    process.on('uncaughtException', (error) => {
        console.error('KESALAHAN TIDAK TERTANGKAP! 💥 Mematikan...');
        console.error(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('PENOLAKAN PROMISE TIDAK TERTANGKAP! 💥 Mematikan...');
        console.error(reason);
    });

    handledGlobalError = true;
}

const app = express();
const port = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');
const ENDPOINTS_FILE = path.join(__dirname, 'list.json');
const API_DIR = path.join(__dirname, 'API');

let dataJson = { daftarTags: [], fitur: [] };
try {
    const rawData = fs.readFileSync(ENDPOINTS_FILE, 'utf-8');
    dataJson = JSON.parse(rawData);
} catch (err) {
    console.error(`Gagal membaca ${ENDPOINTS_FILE}:`, err.message);
}

const endpoints = dataJson.fitur || [];
const daftarTags = dataJson.daftarTags || [];

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: 'Terlalu banyak permintaan, coba lagi nanti.',
    standardHeaders: true,
    legacyHeaders: false,
});

let lastPing = 0;
const counterMiddleware = (req, res, next) => {
    const now = Date.now();
    if (now - lastPing > 2000) { // 2 Detik Cd untuk penghitung
        lastPing = now;
        axios.get('https://copper-ambiguous-velvet.glitch.me/up', { timeout: 3000 })
            .catch(error => console.error('Counter error:', error.message));
    }
    next();
};

app.set('trust proxy', 1);
app.use(apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('json spaces', 2);

// CORS Header
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Custom Response Format
app.use((req, res, next) => {
    res.successJson = (data, statusCode = 200) => res.status(statusCode).json({
        published_By: "NirKyy",
        success: true,
        data
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
    if (!fs.existsSync(dirPath)) return fileList;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getAllJsFiles(fullPath, fileList);
        } else if (stat.isFile() && file.endsWith('.js') && file !== 'index.js') {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const mountedRoutes = new Set();
for (const filePath of getAllJsFiles(API_DIR)) {
    try {
        delete require.cache[require.resolve(filePath)]; // Hapus dari cache
        const handler = require(filePath);
        const endpointName = path.parse(filePath).name;
        const routePath = `/api/v1/${endpointName}`;
        if (mountedRoutes.has(routePath)) {
            console.warn(`Rute duplikat: ${routePath}`);
        }
        mountedRoutes.add(routePath);
        if (typeof handler === 'function') {
            app.use(routePath, counterMiddleware, handler);
            console.log(`Rute ${routePath} dimuat.`);
        }
    } catch (err) {
        console.error(`Gagal memuat ${filePath}:`, err.message);
    }
}

function getUniqueTags(data) {
    const tags = new Set();
    for (const ep of data) {
        if (ep.tags && Array.isArray(ep.tags)) {
            ep.tags.forEach(tag => tag && tags.add(tag.trim()));
        }
    }
    return [...tags].sort();
}

function filterEndpoints(data, { term, tags }) {
    let filtered = [...data];
    if (tags) {
        const tagList = tags.toLowerCase().split(',').map(t => t.trim());
        filtered = filtered.filter(ep => ep.tags?.some(tag => tagList.includes(tag.toLowerCase())));
    }
    if (term) {
        const termLC = term.toLowerCase();
        filtered = filtered.filter(ep => [ep.nama, ep.endpoint, ep.deskripsi].some(
            val => val?.toLowerCase().includes(termLC)) ||
            ep.tags?.some(tag => tag.toLowerCase().includes(termLC)));
    }
    return filtered;
}

const uniqueTagsFromData = getUniqueTags(endpoints);

app.get('/', (req, res) => res.render('index', { endpoints, uniqueTags: uniqueTagsFromData }));
app.get('/tags', (req, res) => res.json({ tags: uniqueTagsFromData }));
app.get('/renderpage', (req, res) => res.json({ endpoints: filterEndpoints(endpoints, { tags: req.query.tags }) }));
app.get('/search', (req, res) => res.json({ endpoints: filterEndpoints(endpoints, { term: req.query.term }) }));

app.use((req, res) => {
    req.accepts('html') ? res.status(404).render('404') : res.status(404).errorJson('Sumber daya tidak ditemukan.', 404);
});

app.use((err, req, res, next) => {
    console.error('ERROR:', err);
    if (res.headersSent) return next(err);
    const code = err.statusCode || 500;
    res.errorJson(err.message || 'Kesalahan tak terduga.', code);
});

const server = app.listen(port, () => console.log(`🚀 Server jalan di port ${port}`));

const gracefulShutdown = (signal) => {
    console.log(`Sinyal ${signal} diterima, menutup server...`);
    server.close(() => {
        console.log('Server ditutup.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

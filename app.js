const express = require('express');
const app = express();
const port = 3000;

app.all('*', (req, res) => {
    const target = `https://nirkyy-dev.hf.space${req.originalUrl}`;
    res.redirect(308, target);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
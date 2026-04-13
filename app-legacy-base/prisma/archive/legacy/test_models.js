
const fs = require('fs');
async function test() {
    const apiKey = 'AIzaSyBkCOYdb2vJJvLN9HiAdSXH5Iz9E88axH0';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        fs.writeFileSync('prisma/models.json', JSON.stringify(data.models?.map(m => m.name), null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();


const express = require('express');
const app = express();
const port = process.env.PORT;
const apiKey = process.env.API_KEY
require('dotenv').config();

const fs = require('fs');
const data = fs.readFileSync("tasks.json", "utf8");
const tasks = JSON.parse(data)

app.use(express.json());

app.use((req, res, next) => {
    req.time = new Date(Date.now()).toString();
    console.log(req.method, req.hostname, req.url, req.time);
    next();
});

 
function checkApiKey(req, res, next) {
    const clientKey = req.headers['x-api-key'];
    if (clientKey !== apiKey) {
        return res.status(401).json({error: 'Unathorized'});
    }
    next();
};


const crypto = require('crypto');

app.get('/', checkApiKey, (req, res) => {
    res.send('Hello this is my crude To-do-lists.')
});

app.post('/tasks', checkApiKey, async (req, res) => {
    const { title, done } = req.body;

    try {
    if (!title || typeof title !== 'string' || typeof done !== 'boolean') {
        return res.status(400).json({ error: "Invalid or missing data" });
    }

    const titleFormat = title.trim().toLowerCase();
    if (titleFormat === "") {
        return res.status(400).json({ error: "Title cannot be empty" });
    }

    const id = crypto.randomUUID();

    const sql = `
        INSERT INTO tasks (id, title, done)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
        
        const result = await pool.query(sql,[id, title, done]);
    
    res.status(201).json({ message: "Task created", task: result.rows[0] });
} catch (error) {
    res.status(500).json({ error: "Internal server error"});
}
});


app.delete('/tasks/:id', checkApiKey, (req, res) => {
    const { id } = req.params;
    try {
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1 ){
        return res.status(400).json({error: "Task not Found"});
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));

    res.json({ message: "Task deleted", task: deletedTask });
    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

app.patch('/tasks/:id', checkApiKey, (req, res) => {
    const { title, done } = req.body;
    const { id } = req.params;

    try {
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1 ) {
        return res.status(400).json({error: "Task not Found"});
    }

    if (title && typeof title === 'string' && title.trim() !== "") {
        tasks[taskIndex].title = title.trim().toLowerCase();
    }

    if (done !== undefined) {
        if (typeof done !== 'boolean') {
            return res.status(400).json({ error: "Done must be a boolean" });
        }
        tasks[taskIndex].done = done;
    }
    fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
    res.json({ message: "Task updated", task: tasks[taskIndex] });
    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
     const result = await pool.query(`SELECT * FROM tasks WHERE id = $1`); 

    if (!rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(result);
    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

app.listen(port, () => {
    console.log('Server running on port 3000');
}); 
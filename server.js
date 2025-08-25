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

const { validate: isUuid, validate } = require('uuid');
const crypto = require('crypto');
const { normalize } = require('path');
const { validateHeaderName } = require('http');
const { title } = require('process');

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


app.delete('/tasks/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;
    
    try {
    
    if (!isUuid(id)) {
        return res.status(400).json({error: "Invalid UUID"});
    }

    const result = await pool.query(`DELETE FROM tasks WHERE id = $1 RETURNING*`, [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Task not found"});
    }

    res.status(200).json({ task: result.rows[0] });
    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

    function validateEnum(value, allowedValues) {
        if (value === null) {
            return null;
        }

        if (typeof value !== "string" || value.trim() === '') {
           throw new Error("Invalid input." );
        }

        const normalized = value.trim().toLowerCase();

        if (!allowedValues.includes(normalized)) {
            throw new Error(`Must be one of ${allowedValues.join(', ')}`);
        }

        return normalized;
    }

app.patch('/tasks/:id', checkApiKey, async (req, res) => {
    const allowedFields = ['title','done', 'dueDate', 'priority', 'status'];
    const { id } = req.params;

    const updates = [];
    const values = [];
    let paramIndex = 1;

        try {
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                let value = req.body[key];

                if (key === 'title' && (typeof value !== 'string' || value.trim() === '')) {
                    return res.status(400).json({ error: "Invalid title." });
                }
                if (key === 'done' && (typeof value !== 'boolean')) {
                    return res.status(400).json({ error: "Done must be a boolean." }); 
                }
                
                if (key === 'dueDate' && value === null) {
                    values.push(null);
                    continue;
                } else {

                const date = new Date(value);
                const today =  new Date();

                if (key === 'dueDate' && (isNaN(date.getTime()) || date < today )) {
                    return res.status(400).json({ error: "Invalid Date." });
                }
                values.push(date.toISOString());
            }
                if (key === 'priority') {
                try {
                const cleaned = validateEnum(value, ['low', 'medium', 'high']);

                    values.push(cleaned);
                } catch (err) {
                        return res.status(400).json({ error: err.message });
                    }
                    continue;
                }
         
                if (key === 'status') {
            try {
               const cleaned = validateEnum(value, ['pending', 'in-progress', 'completed']);

                values.push(cleaned);
            } catch (err) {
                    return res.status(400).json({ error: err.message });
            }
                continue;
            }
        
                updates.push(`${key} = $${paramIndex}`);
                if (key === 'title') {
                    values.push(value.trim().toLowerCase());
                } else {
                    values.push(value);
                } 

    }
}
    if (updates.length === 0) {
        return res.status(400).json({ error: " No valid fields to update" });
    }

    const sql = `
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *;
    `;

    values.push(id);

    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
    return res.status(404).json({error: "Task not Found"});
    }

    res.json({ message: "Task updated", task: result.rows[0] });

    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
     const result = await pool.query(`SELECT * FROM tasks WHERE id = $1`, [id]); 

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
    } catch (error) {
    res.status(500).json({ error: "Internal server error"});
    }
});

app.get('/tasks', checkApiKey, async (req, res) => {
    try {
        // --- VALIDATION ---
        if (req.query.title && req.query.title.trim() === '') {
            return res.status(400).json({ error: "Please provide input." });
        } 
        if (req.query.done && req.query.done !== 'true' && req.query.done !== 'false')  {
            return res.status(400).json({ error: "Invalid input for done." }); 
        }

        // --- FILTERS ---
        const filters = [];
        const values = [];
        let paramIndex = 1; // needs to be mutable, so use let

        if (req.query.title) {
            filters.push(`title ILIKE $${paramIndex}`);
            values.push(`%${req.query.title.trim()}%`);
            paramIndex++;
        }

        if (req.query.done) {
            const normalized = req.query.done.toLowerCase();
            if (['true', '1'].includes(normalized)) {
                filters.push(`done = $${paramIndex}`);
                values.push(true);
                paramIndex++;
            } else if (['false', '0'].includes(normalized)) {
                filters.push(`done = $${paramIndex}`);
                values.push(false);
                paramIndex++;
            }
        }

        // --- BASE QUERY ---
        let sql = "SELECT * FROM tasks";

        if (filters.length > 0) {
            sql += " WHERE " + filters.join(" AND ");
        }

        // --- EXECUTE QUERY ---
        const result = await pool.query(sql, values);

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error." });
    }
});

app.listen(port, () => {
    console.log('Server running on port 3000');
}); (key === 'title' && (typeof value !== 'string' || value.trim() === ''))
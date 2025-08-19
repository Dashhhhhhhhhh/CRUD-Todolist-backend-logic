const express = require('express');
const app = express();
app.use(express.json());

const tasks = [];
const crypto = require('crypto');

app.get('/', (req, res) => {
    res.send('Hello this is my crude To-do-lists.')
});

app.post('/tasks', (req, res) => {
    const { title, done } = req.body;

    if (!title || typeof title !== 'string' || typeof done !== 'boolean') {
        return res.status(400).json({ error: "Invalid or missing data" });
    }

    const titleFormat = title.trim().toLowerCase();
    if (titleFormat === "") {
        return res.status(400).json({ error: "Title cannot be empty" });
    }

    const newTask = {
        id: crypto.randomUUID(),
        title: titleFormat,
        done
    };

    tasks.push(newTask);
    res.status(201).json({ message: "Task created", task: newTask });
});


app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1 ){
        return res.status(400).json({error: "Task not Found"});
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({ message: "Task deleted", task: deletedTask });
});

app.patch('/tasks/:id', (req, res) => {
    const { title, done } = req.body;
    const { id } = req.params;

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

    res.json({ message: "Task updated", task: tasks[taskIndex] });

});

app.get('/tasks/:id', (req, res) => {
    const { id } = req.params;

    const task = tasks.find(task => task.id === id);

    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
}); 
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const io = require('socket.io')(http, {
  cors: {
    origin: ["http://192.168.43.169:8080", "http://localhost:8080", proccess.env.CLIENT_URL],
    methods: ["GET", "POST"],  
    credentials: true
  },
    allowEIO3: true
});
const { v4: uuidv4 } = require('uuid');
const generateId = () => uuidv4();

var rooms = {};
var users = {};

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors({
    origin:"*",
}));

app.get('/',(req,res) => {
    res.send('yes')
});

app.post('/room', (req,res) => {
    var body = req.body;
    let room_id = generateId();
    rooms[room_id] = {
        room_id:room_id,
        room_name:body.room_name,
    };
    rooms[room_id]['users'] = {};
    rooms[room_id]['users_count'] = 0;
    rooms[room_id]['data'] = {};
    rooms[room_id]['data_count'] = 0;
    return res.status(200).json({
        room_id
    });
});

io.on('connection', (socket) => {


    socket.on('picked',(data) => {
        let data_count = rooms[data.room_id]['data_count'];
        rooms[data.room_id]['data'][socket.id] = data.card;
        rooms[data.room_id]['users'][socket.id]['status'] = 'picked';
        rooms[data.room_id]['data_count'] = data_count+1;       
        console.log(rooms[data.room_id]);

        io.to(data.room_id).emit('new_data', rooms[data.room_id]);
    });

    socket.on('new_user', (username) => { 
        users[socket.id] = username;
        console.log(users);
    });

    socket.on('disconnecting', () => {
        try{
            var room_id = Array.from(socket.rooms.entries())[1][0]
            io.to(room_id).emit('log_disconnect', users[socket.id]);
            rooms[room_id]['users_count'] -= 1;
            if(rooms[room_id]['users_count'] == 0){
                delete rooms[room_id];
            }
            delete users[socket.id];
            delete rooms[room_id]['users'][socket.id];
            io.to(room_id).emit('new_data', rooms[room_id]);
        }catch(err){
            console.log(err.message);
        }
    });

    socket.on("join_room", (data) => {
        if (!data.room_id || !rooms[data.room_id]) {
            return null
        }
        io.to(data.room_id).emit('log_join', users[socket.id]);
        socket.join(data.room_id);
        let this_room = rooms[data.room_id];
        console.log(this_room);
        let user_count = this_room['users_count'];
        if ( user_count < 2) {
            this_room['users'][socket.id] = {
                user_id :socket.id,
                username:users[socket.id],
                status:'picking',
                score:0,
            };
            this_room['users_count'] = user_count+1;    
            console.log(rooms);
            var joined = {
                room_name   : this_room['room_name'],
                user_count  : this_room['user_count'],
                room        : this_room,
            };
            console.log(this_room.users);
            io.to(data.room_id).emit('room_joined',joined);
            socket.emit('self', rooms[data.room_id]['users'][socket.id],)
        }else{
            socket.emit('room_full');
        }
    });

    socket.on('win',(room_id) => {
        rooms[room_id]['data'] = {};
        rooms[room_id]['data_count'] = 0;
        rooms[room_id]['users'][socket.id]['score'] += 1;
        rooms[room_id]['users'][socket.id]['status'] = 'picking';
        io.to(room_id).emit('new_data', rooms[room_id]);

    });

    socket.on('lose',(room_id) => {
        rooms[room_id]['data'] = {};
        rooms[room_id]['data_count'] = 0;
        rooms[room_id]['users'][socket.id]['status'] = 'picking';
        io.to(room_id).emit('new_data', rooms[room_id]);
    });

    socket.on('tie',(room_id) => {
        rooms[room_id]['data'] = {};
        rooms[room_id]['data_count'] = 0;
        rooms[room_id]['users'][socket.id]['status'] = 'picking';
        io.to(room_id).emit('new_data', rooms[room_id]);
    });


    socket.emit('halo', {
        msg:"halo"
    });

});

http.listen(3000, () => {
    console.log('web ok');
});


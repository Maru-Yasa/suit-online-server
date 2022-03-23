const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
const { v4: uuidv4 } = require('uuid');
const generateId = () => uuidv4();

var room = {
    room_id:"uuid",
    room_name : "ayo duel",
    users:[
        {
            id:"123123123",
            username:"maru",
            score:1,
        },
        {
            id:"123123123",
            username:"ilyas",
            score:0,
        },
    ],
};
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

    socket.on('disconnect', () => {
        delete users[socket.id];
        console.log(users);
    });

    socket.on("join_room", (data) => {
        if (!data.room_id) {
            
        }
        socket.join(data.room_id);
        let this_room = rooms[data.room_id];
        console.log(this_room);
        let user_count = this_room['users_count'];
        if ( user_count < 2) {
            this_room['users'][socket.id] = {
                user_id :socket.id,
                username:users[socket.id],
                status:'picking',
            };
            this_room['users_count'] = user_count+1;
            console.log(rooms);
            var joined = {
                room_name   : this_room['room_name'],
                user_count  : this_room['user_count'],
                room        : this_room,
            };
            io.to(data.room_id).emit('room_joined',joined);
            socket.emit('self', {
                    user_id : socket.id,
                    username : users[socket.id],
                },)
        }else{
            socket.emit('room_full');
        }
    });

    // socket.on('new_room',(data) => {
    //     let username = data.username;
    //     let userId = socket.id;
    //     let room_id = generateId();
    //     let room_name = data.room_name;
    //     socket.join(room_id);

    //     rooms[room_id] = {
    //         room_id:room_id,
    //         room_name:room_name,
    //         host:null,
    //         player:null,
    //     }

    //     rooms[room_id]['host'] = {
    //         user_id : userId,
    //         username:username,
    //         score:0,
            
    //     };
    //     console.log(rooms[room_id]);
    //     io.to(room_id).emit('room_created', rooms[room_id]);

    // });


    socket.emit('halo', {
        msg:"halo"
    });

});

http.listen(3000, () => {
    console.log('web ok');
});


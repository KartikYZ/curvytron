/**
 * RoomsRepository
 *
 * @param {SocketCLient} client
 */
function RoomsRepository(client)
{
    EventEmitter.call(this);

    this.client = client;
    this.rooms  = new Collection([], 'name');

    this.start            = this.start.bind(this);
    this.onRoomOpen       = this.onRoomOpen.bind(this);
    this.onRoomClose      = this.onRoomClose.bind(this);
    this.onRoomPlayers    = this.onRoomPlayers.bind(this);
    this.onRoomGame       = this.onRoomGame.bind(this);
    this.onRoomConfigOpen = this.onRoomConfigOpen.bind(this);
    this.fetchRemoteRooms = this.fetchRemoteRooms.bind(this);
    this.onRemoteRooms    = this.onRemoteRooms.bind(this);

    this.remoteLoop = null;
}

RoomsRepository.prototype = Object.create(EventEmitter.prototype);
RoomsRepository.prototype.constructor = RoomsRepository;

/**
 * How often to refresh rooms hosted on other servers, in milliseconds
 *
 * @type {Number}
 */
RoomsRepository.prototype.remoteInterval = 5000;

/**
 * Attach events
 */
RoomsRepository.prototype.attachEvents = function()
{
    this.client.on('room:open', this.onRoomOpen);
    this.client.on('room:close', this.onRoomClose);
    this.client.on('room:players', this.onRoomPlayers);
    this.client.on('room:game', this.onRoomGame);
    this.client.on('room:config:open', this.onRoomConfigOpen);
};

/**
 * Attach events
 */
RoomsRepository.prototype.detachEvents = function()
{
    this.client.off('room:open', this.onRoomOpen);
    this.client.off('room:close', this.onRoomClose);
    this.client.off('room:players', this.onRoomPlayers);
    this.client.off('room:game', this.onRoomGame);
    this.client.off('room:config:open', this.onRoomConfigOpen);
};

/**
 * Get all
 *
 * @return {Array}
 */
RoomsRepository.prototype.all = function()
{
    return this.rooms;
};

/**
 * Get all
 *
 * @return {Array}
 */
RoomsRepository.prototype.get = function(name)
{
    return this.rooms.getById(name);
};

/**
 * Create
 *
 * @param {String} name
 * @param {Function} callback
 */
RoomsRepository.prototype.create = function(name, callback)
{
    if (typeof(name) === 'string') {
        name = name.substr(0, Room.prototype.maxLength).trim();
    }

    this.client.addEvent('room:create', {name: name}, callback);
};

/**
 * Create room proxy object from data
 *
 * @param {Object} data
 *
 * @return {Object}
 */
RoomsRepository.prototype.createRoom = function(data)
{
    return new RoomListItem(data.name, data.players,  data.game, data.open);
};

// EVENTS:

/**
 * On room open
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomOpen = function(e)
{
    var existing = this.get(e.detail.name),
        room     = this.createRoom(e.detail);

    if (existing && existing.remote) {
        this.rooms.remove(existing);
    }

    if(this.rooms.add(room)) {
        this.emit('room:open', {room: room});
    }
};

/**
 * On close room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomClose = function(e)
{
    var room = this.get(e.detail.name);

    if(room && this.rooms.remove(room)) {
        this.emit('room:close', room);
    }
};

/**
 * On room config open change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomConfigOpen = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.open = e.detail.open;
        this.emit('room:config:open', room);
    }
};

/**
 * On room players change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomPlayers = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.players = e.detail.players;
        this.emit('room:players', room);
    }
};

/**
 * On room game change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomGame = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.game = e.detail.game;
        this.emit('room:game', room);
    }
};

/**
 * Start
 */
RoomsRepository.prototype.start = function()
{
    if (this.client.connected) {
        this.attachEvents();
        this.client.addEvent('room:fetch');

        if (Launcher.url() && !this.remoteLoop) {
            this.fetchRemoteRooms();
            this.remoteLoop = setInterval(this.fetchRemoteRooms, this.remoteInterval);
        }
    } else {
        this.client.on('connected', this.start);
    }
};

/**
 * Pause
 */
RoomsRepository.prototype.stop = function()
{
    clearInterval(this.remoteLoop);
    this.remoteLoop = null;

    this.detachEvents();
    this.rooms.clear();
};

/**
 * Fetch the rooms on every server from the launcher
 */
RoomsRepository.prototype.fetchRemoteRooms = function()
{
    fetch(Launcher.roomsUrl())
        .then(function (response) { return response.json(); })
        .then(this.onRemoteRooms, function (error) { console.error('Could not list rooms: %s', error); });
};

/**
 * List rooms hosted on other servers, which the lobby joins through the launcher
 *
 * @param {Array} list
 */
RoomsRepository.prototype.onRemoteRooms = function(list)
{
    if (!this.remoteLoop) {
        return;
    }

    var repository = this,
        names      = {},
        room, i;

    for (i = list.length - 1; i >= 0; i--) {
        names[list[i].name] = true;
        room = this.get(list[i].name);

        if (!room) {
            room = this.createRoom(list[i]);
            room.remote = true;

            if (this.rooms.add(room)) {
                this.emit('room:open', {room: room});
            }
        } else if (room.remote) {
            room.players = list[i].players;
            room.game    = list[i].game;
            room.open    = list[i].open;
            this.emit('room:players', room);
        }
    }

    this.rooms.filter(function () { return this.remote && !names[this.name]; }).walk(function () {
        repository.rooms.remove(this);
        repository.emit('room:close', this);
    });
};

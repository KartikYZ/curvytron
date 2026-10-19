/**
 * Modal Sticky Sessions launcher
 */
function Launcher() {}

/**
 * Get the launcher URL, or null when Curvytron runs without one
 *
 * @return {String|null}
 */
Launcher.url = function()
{
    return window.CURVYTRON_LAUNCHER_URL ? window.CURVYTRON_LAUNCHER_URL.replace(/\/$/, '') : null;
};

/**
 * Get the launcher URL that opens the given room
 *
 * @param {String} name
 * @param {String} password
 *
 * @return {String}
 */
Launcher.roomUrl = function(name, password)
{
    return Launcher.url() + '/room/' + encodeURIComponent(name) + (password ? '?password=' + encodeURIComponent(password) : '');
};

/**
 * Get the URL listing the rooms on every server
 *
 * @return {String}
 */
Launcher.roomsUrl = function()
{
    return Launcher.url() + '/rooms';
};

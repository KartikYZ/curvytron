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

/**
 * Session storage key naming the room this tab last opened through the launcher
 *
 * @type {String}
 */
Launcher.openedKey = 'curvytron-launcher-opened';

/**
 * Whether no route has rendered yet since this page loaded
 *
 * @type {Boolean}
 */
Launcher.firstRoute = true;

/**
 * Open the given room through the launcher, which routes this tab to the room's session
 *
 * @param {String} name
 * @param {String} password
 * @param {Boolean} replace
 */
Launcher.open = function(name, password, replace)
{
    try {
        window.sessionStorage.setItem(Launcher.openedKey, name);
    } catch (error) {
        console.error('Could not remember the opened room: %s', error);
    }

    if (replace) {
        window.location.replace(Launcher.roomUrl(name, password));
    } else {
        window.location.assign(Launcher.roomUrl(name, password));
    }
};

/**
 * Whether this page load of the given room has to go through the launcher first,
 * because it didn't come from there and may carry another session's cookie
 *
 * @param {String} name
 *
 * @return {Boolean}
 */
Launcher.mustOpen = function(name)
{
    var firstRoute = Launcher.firstRoute;

    Launcher.firstRoute = false;

    if (!Launcher.url() || !firstRoute) {
        return false;
    }

    try {
        if (window.sessionStorage.getItem(Launcher.openedKey) === name) {
            window.sessionStorage.removeItem(Launcher.openedKey);

            return false;
        }
    } catch (error) {
        console.error('Could not read the opened room: %s', error);

        return false;
    }

    return true;
};

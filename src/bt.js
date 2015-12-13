/*!
 * @author        : a-Sansara <dev]]@[[a-sansara]]dot[[net>
 * @contributors  :
 * @copyright     : pluie.org
 * @date          : 2015-12-10 22:22:34
 * @version       : 0.2
 * @license       : MIT
 * @require       : html5 localStorage
 * @desc          :
 *
 *  BrowserTab USAGE :
 *
 *
 *  Initialize
 *
 *      $(document).ready(function() {
 *          $bt.init();
 *      }
 *
 *  Internal Commands
 *
 *      // append data on node to other browser tabs
 *      $bt.append('#test', '<b>it's cool to append</b>');
 *      // rewrite content on node to other browser tabs
 *      $bt.html('#test', '<b>it's cool to rewrite</b>');
 *
 *  Custom Commands
 *
 *      // define a new custom cmd
 *      $bt.CMD_CUSTOM = "customCmd";
 *      // treat custom command to other browser tabs
 *      $bt.on = function(cmd) {
 *          switch (cmd.name) {
 *              case $bt.CMD_CUSTOM :
 *                  // do stuff
 *                  $bt.log("custom command `'+cmd.name+'` with `'+cmd.customKey+'`');
 *              break;
 *          }
 *      }
 *
 *      // send a custom command to other browser tabs
 *      $bt.send({ name : $bt.CMD_CUSTOM, customKey : 'customValue' });
 *
 *  enjoy !
 */
var $bt  = {
    TRACE      : true && typeof console != "undefined",
    /*! @constant LS_TABS localStorage key for browsertabs list  */
    LS_TABS    : 'bt.tabs',
    /*! @constant LS_CURTAB localStorage key for current browsertab */
    LS_CURTAB  : 'bt.ctab',
    /*! @constant LS_CMD localStorage key command to interact with other tabs */
    LS_CMD     : 'bt.cmd',
    /*! @constant CMD_SYNC internal command to perform a browser tab synchro */
    CMD_SYNC   : 'bt.sync',
    /*! @constant CMD_APPEND internal command to perform a dom append */
    CMD_APPEND : 'dom.append',
    /*! @constant CMD_HTML internal command to perform a dom html */
    CMD_HTML   : 'dom.html',
    /*!
     * @desc    initialize on dom ready
     * @public
     * @method  init
     * @param   string  fn          a function to call on initializing on dom ready
     */
    init       : function(fn) {
        this._init(fn);
    },
    /*!
     * @desc    custom method to implements custom command
     * @public
     * @method  on
     * @param   string  cmd         a cmd to treat
     */
    on         : function(cmd) {
        // custom
        this.log(cmd);
    },
    /*!
     * @desc    console log if trace is enabled
     * @public
     * @method  on
     * @param   mix     data        data to log
     */
    log        : function(data) {
        if (this.TRACE) console.log(data);
    },
    /*!
     * @desc    send a command to other tabs
     * @public
     * @method  send
     * @param   object  cmd         the cmd to send
     */
    send       : function(cmd) {
        cmd.uid  = this.id+Math.random();
        cmd.from = this.id;
        if (typeof cmd.to == "undefined") cmd.to = "*";
        $l.set(this.LS_CMD, $j.str(cmd));
        $l.rem(this.LS_CMD);
    },
    /*!
     * @desc    perform an dom append command on other tabs
     * @public
     * @method  append
     * @param   string  selector    the selector wich target the node(s)
     * @param   string  data        the data to append
     */
    append     : function(selector, data, btid) {
        this._dom(this.CMD_APPEND, selector, data, btid);
    },
    /*!
     * @desc    perform an dom html command on other tabs
     * @public
     * @method  append
     * @param   string  selector    the selector wich target the node(s)
     * @param   string  data        the data to append
     */
    html       : function(selector, data, btid) {
        this._dom(this.CMD_HTML, selector, data, btid);
    },
    /*!
     * @desc    perform an dom synchro command on other tabs
     * @public
     * @method  sync
     * @param   string  selector    the selector wich target the node(s) to synchro
     */
    sync       : function(selector, btid) {
        this._dom(this.CMD_HTML, selector, $q(selector).html(), btid);
    },
    /*! @private */
    _refresh   : function() {
        $bt.list = $j.obj($l.get($bt.LS_TABS));
    },
    /*! @private */
    _broadcast : function() {
        $bt.send({ name : $bt.CMD_SYNC });
    },
    /*! @private */
    _remove    : function(id) {
        if (!id) id = $bt.id;
        var i = $bt.list.indexOf(id);
        if (i > -1) $bt.list.splice(i, 1);
    },
    /*! @private */
    _init      : function(fn) {
        $v(window).on('beforeunload', $bt._unload);
        $v(window).on('storage', $bt._cmd);
        $v(window).on('focus', $bt._focus);
        //~ $l.clear();
        $bt.id   = (new Date).getTime();
        var t    = $l.get($bt.LS_TABS);
        $bt.list = t==null ? [] : $j.obj(t);
        $bt.list.push($bt.id);
        $l.set($bt.LS_TABS, $j.str($bt.list));
        $bt._broadcast();
        $bt.log($bt.list);
        if (typeof fn == "function") fn();
    },
    /*! @private */
    _dom       : function(n, s, d, id) {
        $bt.send({ name : n, selector : s, data : d, to : !id ? '*' : id });
    },
    /*! @private */
    _unload    : function(e) {
        $bt._refresh();
        $bt._remove();
        $l.set($bt.LS_TABS, $j.str($bt.list));
        $bt._broadcast();
        return null;
    },
    /*! @private */
    _focus     : function(e) {
        $l.set($bt.LS_CURTAB, $bt.id);
    },
    /*! @private */
    _cmd       : function(e) {
        if (e.key!=$bt.LS_CMD) return;
        var cmd = $j.obj(e.newValue);
        if (!cmd) return;
        if (cmd.to == "*" || cmd.to == $bt.id) {
            $bt.log(cmd);
            switch(cmd.name) {

                case $bt.CMD_SYNC : 
                    $bt._refresh();
                    $bt.log($bt.list);
                    break;

                case $bt.CMD_APPEND :
                    $bt.log("do "+$bt.CMD_APPEND);
                    $v(cmd.selector).append(cmd.data);
                    break;

                case $bt.CMD_HTML :
                    $bt.log("do "+$bt.CMD_HTML);
                    $v(cmd.selector).html(cmd.data);
                    break;

                default :
                    // do your stuff here
                    if (typeof $bt.on == "function") $bt.on(cmd);
            }
        }
    }
}
// vanilla minimal jquery style
var $v = function(p) {
    var s  = typeof p == "string";
    var z = "cool";
    var c = s ? document.querySelectorAll(p) : null;
    var a = s ? [].slice.call(c) : [p];
    delete(s);
    // alias 
    if (p==localStorage) {
        return {
            clear : function() { return p.clear(); },
            get   : function(k) { return p.getItem(k); },
            rem   : function(k) { return p.removeItem(k); },
            set   : function(k, v) { return p.setItem(k, v); }
        };
    }
    // alias 
    else if (p==JSON) {
        // alias JSON
        return {
            str : function(o) { return p.stringify(o); },
            obj : function(s) { return p.parse(s); }
        };
    }
    else {
        this.foreach = function(f) {
            [].forEach.call(c, f);
        };
        // assume uniq selector
        // Living Standard cf https://w3c.github.io/DOM-Parsing/#innerhtml
        this.html = function(d) {
            if (arguments.length == 0) return a[0].innerHTML;
            else a[0].innerHTML = d;
        };
        this.append = function(d) {
            this.foreach(function(n) {
                n.innerHTML += d;
            });
        };
        this.on = function(t, f, u) {
            if (c != null) {
                this.foreach(function(n) {
                    n.addEventListener(t, f, u===true);
                });
            }
            else a[0].addEventListener(t, f, u===true);
        };
        // assume uniq selector
        this.val = function(d) {
            if (arguments.length == 0) return a[0].value;
            else a[0].value = d;
        };
        // assume uniq selector
        this.attr = function(k, v) {
            if (arguments.length == 1) return a[0].getAttribute(k);
            else a[0].setAttribute(k, v);
        };
        this.ready = function(f) {
            document.addEventListener('DOMContentLoaded', f);
        };
    return this;
    }
}
// alias localStorage
var $l = $v(localStorage);
// alias json
var $j = $v(JSON);

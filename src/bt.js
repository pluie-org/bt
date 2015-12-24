/*!
 * @author        : a-Sansara <dev]]@[[a-sansara]]dot[[net>
 * @contributors  :
 * @copyright     : pluie.org
 * @date          : 2015-12-10 22:22:34
 * @version       : 0.6
 * @license       : MIT
 * @require       : html5 localStorage svan (small vanilla jquery-like lib)
 * @desc          : manage communication between browser tabs
 *
 *  USAGE :
 *
 *
 *  Initialize
 *
 *
 *      $(document).ready(function() {
 *          // $bt.zkillonload = false // disable zombkill cmd at statup
 *          $bt.init(optionalCallback);
 *      });
 *
 *
 *
 *  Internal Commands
 *
 *      // append data on node to other browser tabs
 *      $bt.append('#test', "<b>it's cool to append</b>");
 *
 *      // rewrite content on node to other browser tabs
 *      $bt.html('#test', "<b>it's cool to rewrite</b>");
 *
 *      // append content to specific browser tab
 *      $bt.append('#test', "<b>it's cool to rewrite</b>", null, null, '1449974562012');
 *
 *      // rewrite content to specified browser tab with callback
 *      $bt.html('#test', "<b>it's cool to rewrite</b>", null, function() { alert('callback'); }, '1449974562012');
 *
 *      // append content to specified browser tab on specific frame
 *      $bt.append('#test', "<b>it's cool to rewrite</b>", 'frameName', null, '1449974562012');
 *
 *      // perform a node synchro to other browser tabs
 *      $bt.sync('#test');
 *
 *      // perform a node synchro to specified browser tab on specific frame with callback
 *      $bt.sync('#test', 'frameName', callback, '1449974562012');
 *
 *      // reload other browser tabs
 *      $bt.reload();
 *
 *      // reload specific browser tab to specific url
 *      $bt.reload(window.location.path+"?reloaded=1", '1449974562012');
 *
 *      // check and kill zombies tabs
 *      $bt.zombkill();
 *
 *      // get browser tab list
 *      $bt.list;
 *
 *      // current browser tab id
 *      $bt.id;
 *
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
 *  Bonus
 *
 *      // alias localStorage : clear|rem|get|set
 *      $l;
 *      // alias json : str|obj
 *      $j
 *
 *  enjoy !
 */

var $l = (function alias() {
    var a = localStorage;
    return {
        clear : function() { return a.clear(); },
        get   : function(k) { return a.getItem(k); },
        rem   : function(k) { return a.removeItem(k); },
        set   : function(k, v) { return a.setItem(k, v); }
    };
}());

var $j = (function alias() {
    var a = JSON;
    return {
        str : function(o) { return a.stringify(o); },
        obj : function(s) { return a.parse(s); }
    };
}());

var $bt  = {
    VERSION      : 0.6,
    TRACE        : true && !$.isNone(console),
    /*! @constant LS_TABS localStorage key for browsertabs list  */
    LS_TABS      : 'bt.list',
    /*! @constant LS_CURTAB localStorage key for current browsertab */
    LS_CURTAB    : 'bt.current',
    /*! @constant LS_CMD localStorage key command to interact with other tabs */
    LS_CMD       : 'bt.event',
    /*! @constant CMD_SYNC internal command to perform a browser tab synchro */
    CMD_SYNC     : 'bt.sync',
    /*! @constant CMD_VAR_SET internal command to perform a browser tab var set */
    CMD_VAR_SET  : 'bt.set',
    /*! @constant CMD_VAR_GET internal command to perform a browser tab var get */
    CMD_VAR_GET  : 'bt.get',
    /*! @constant CMD_APPEND internal command to perform a dom append */
    CMD_APPEND   : 'bt.dom.append',
    /*! @constant CMD_HTML internal command to perform a dom html */
    CMD_HTML     : 'bt.dom.rewrite',
    /*! @constant CMD_RELOAD internal command to perform a browser tab reload */
    CMD_RELOAD   : 'bt.reload',
    /*! @constant CMD_ZOMBKILL internal command to perform a browser tab zombies kill */
    CMD_ZOMBKILL : 'bt.zombkill',
    /*! @constant CMD_DONTKILL internal command to perform a dontkill browser tab (CMD_ZOMBKILL reply) */
    CMD_DONTKILL : 'bt.dontkill',
    /*! @var vars */
    vars         : [],
    /*! @var zomblist */
    zomblist     : [],
    /*! @var zkillonload */
    zkillonload  : true,
    /*! @var zombTimeout in ms */
    zombTimeout  : 250,
    /*!
     * @desc    initialize on dom ready
     * @public
     * @method  init
     * @param   string  fn          a function to call on initializing on dom ready
     */
    init         : function(fn) {
        this._init(fn);
    },
    /*!
     * @desc    custom method to implements custom command
     * @public
     * @method  on
     * @param   string  cmd         a cmd to treat
     */
    on           : function(cmd) {
        // custom
        this.log(cmd);
    },
    /*!
     * @desc    console log if trace is enabled
     * @public
     * @method  on
     * @param   mix     data        data to log
     */
    log          : function(data) {
        if (this.TRACE) console.log(data);
    },
    /*!
     * @desc    send a command to other tabs
     * @public
     * @method  send
     * @param   object  cmd         the cmd to send
     */
    send         : function(cmd) {
        cmd.uid  = this.id+Math.random();
        cmd.from = this.id;
        if ($.isNone(cmd.to)) cmd.to = "*";
        cmd = $j.str(cmd);
        $bt.log('sending cmd : '+this.LS_CMD+' : '+cmd);
        $l.set(this.LS_CMD, cmd);
        $l.rem(this.LS_CMD);
    },
    /*!
     * @desc    perform a dom append command on other tabs
     * @public
     * @method  append
     * @param   string  selector    the selector wich target the node(s)
     * @param   string  data        the data to append
     * @param   string  ctx         context name of selector (frame name relative to document wich match specified selector) or if not defined or null current document
     * @param   int     btid        target browser tab id (if not defined all target all tabs)
     */
    append       : function(selector, data, ctx, fn, btid) {
        this._dom(this.CMD_APPEND, ctx, selector, data, fn, btid);
    },
    /*!
     * @desc    perform a dom html command on other tabs
     * @public
     * @method  append
     * @param   string  selector    the selector wich target the node(s)
     * @param   string  data        the data to append
     * @param   string  ctx         context name of selector (frame name relative to document wich match specified selector) or if not defined or null current document
     * @param   int     btid        target browser tab id (if not defined all target all tabs)
     */
    html         : function(selector, data, ctx, fn, btid) {
        this._dom(this.CMD_HTML, ctx, selector, data, fn, btid);
    },
    /*!
     * @desc    perform a dom synchro command on other tabs
     * @public
     * @method  sync
     * @param   string  selector    the selector wich target the node(s) to synchro
     * @param   string  ctx         context name of selector (frame name relative to document wich match specified selector) or if not defined or null current document
     * @param   int     btid        target browser tab id (if not defined all target all tabs)
     */
    sync         : function(selector, ctx, fn, btid) {
        var c = !$.isNone(ctx) && ctx != null ? parent.frames[ctx].document : document;
        this._dom(this.CMD_HTML, ctx, selector, $(selector, c).html(), fn, btid);
    },
    /*!
     * @desc    perform a reload command on other tabs with specified url
     * @public
     * @method  reload
     * @param   string  url         the url to load (if not defined load current page)
     * @param   int     btid        target browser tab id (if not defined all target all tabs)
     */
    reload       : function(url, btid) {
        $bt.send({ name : $bt.CMD_RELOAD, url : url, to : !btid ? '*' : btid });
    },
    /*!
     * @desc    kill all zombi tabs
     * @public
     * @method  zombkill
     * @param   int     timeout     timeout ins ms for killing zombies (no ping reply)
     */
    zombkill     : function(callback, timeout) {
        var askid = (new Date).getTime();
        $bt.zomblist[''+askid] = [];
        $bt.list.forEach(function(id) {
            if (id != $bt.id) {
                $bt.zomblist[''+askid]['ping'+id] = '';
            }
        });
        $bt.send({ name : $bt.CMD_ZOMBKILL, askid : askid, to : '*' });
        var tid = setTimeout(function() {
            $bt._refresh();
            for(var k in $bt.zomblist[''+askid]) {
                if ($bt.zomblist[''+askid][k] != 'pong') {
                    var i = $bt.list.indexOf(parseInt(k.substring(4)));
                    if (i > -1) $bt.list.splice(i, 1);
                }
            }
            $l.set($bt.LS_TABS, $j.str($bt.list));
            $bt._broadcast();
            $bt.log($bt.list);
            clearTimeout(tid);
            if ($.isFunc(callback)) callback();
        }, !timeout ? $bt.zombTimeout : timeout);
    },
    _dontkill    : function(askid, id) {
        $bt.send({ name : $bt.CMD_DONTKILL, askid : askid, to : id });
    },
    /*! @private */
    _refresh     : function() {
        $bt.list = $j.obj($l.get($bt.LS_TABS));
    },
    /*! @private */
    _broadcast   : function() {
        $bt.send({ name : $bt.CMD_SYNC });
    },
    /*! @private */
    _remove      : function(id) {
        if (!id) id = $bt.id;
        var i = $bt.list.indexOf(id);
        if (i > -1) $bt.list.splice(i, 1);
    },
    /*! @private */
    _init        : function(fn) {
        $(window).on('beforeunload', $bt._unload);
        $(window).on('storage', $bt._cmd);
        $(window).on('focus', $bt._focus);
        $bt.id   = (new Date).getTime();
        var t    = $l.get($bt.LS_TABS);
        $bt.list = t==null ? [] : $j.obj(t);
        $bt.list.push($bt.id);
        $l.set($bt.LS_TABS, $j.str($bt.list));
        $bt._broadcast();
        $bt.log($bt.list);
        if ($bt.zkillonload) $bt.zombkill(fn);
        else if ($.isFunc(fn)) {
            fn();
        }
    },
    /*! @private */
    _dom         : function(n, c, s, d, fn, id) {
        $bt.send({ name : n, context : c, selector : s, data : d, fn : fn, to : !id ? '*' : id });
    },
    /*! @private */
    _unload      : function(e) {
        $bt._refresh();
        $bt._remove();
        $l.set($bt.LS_TABS, $j.str($bt.list));
        $bt._broadcast();
        return null;
    },
    /*! @private */
    _focus       : function(e) {
        $l.set($bt.LS_CURTAB, $bt.id);
    },
    /*! @private */
    _cmd         : function(e) {
        if (!$.isNone(e.originalEvent)) e = e.originalEvent;
        if (e.key!=$bt.LS_CMD) return;
        var cmd = $j.obj(e.newValue);
        if (!cmd) return;
        $bt.log('RECEIVING cmd '+cmd.name+' : ');
        if (cmd.to == "*" || cmd.to == $bt.id) {
            $bt.log("do "+cmd.name);
            $bt.log(cmd);
            try {
                if (!$.isNone(cmd.context)) {
                    $bt.log(cmd.context);
                    cmd.context = window.parent.frames[cmd.context].document;
                    $bt.log(cmd.context);
                }
            }
            catch(e) {
                $bt.log("bad context "+cmd.context+" : "+e.message);
            }
            switch(cmd.name) {

                case $bt.CMD_SYNC : 
                    $bt._refresh();
                    $bt.log($bt.list);
                    break;

                case $bt.CMD_APPEND :
                    $(cmd.selector, cmd.context).append(cmd.data);
                    break;

                case $bt.CMD_HTML :
                    $(cmd.selector, cmd.context).html(cmd.data);
                    break;

                case $bt.CMD_RELOAD :
                    window.location = !$.isNone(cmd.url) ? cmd.url : window.location;
                    break;

                // emit response for zombkill
                case $bt.CMD_ZOMBKILL :
                    $bt._dontkill(cmd.askid, cmd.from);
                    break;

                // receiv response for zombkill
                case $bt.CMD_DONTKILL :
                    $bt.zomblist[''+cmd.askid]['ping'+cmd.from] = 'pong';
                    break;

                default :
                    // do your stuff here
                    if ($.isFunc($bt.on)) $bt.on(cmd);
            }
            if ($.isStr(cmd.fn) && cmd.fn.length>0) {
                $bt.log(cmd.fn);
                var f = eval("window."+cmd.fn);
                if ($.isFunc(f)) {
                    f();
                }
            }
        }
        else {
            $bt.log("ignoring (not target)");
        }
    }
}

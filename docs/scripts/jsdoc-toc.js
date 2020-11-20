(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"Morebits.html\">Morebits</a>","id":"Morebits","children":[{"label":"<a href=\"Morebits.array.html\">array</a>","id":"Morebits.array","children":[]},{"label":"<a href=\"Morebits.batchOperation.html\">batchOperation</a>","id":"Morebits.batchOperation","children":[]},{"label":"<a href=\"Morebits.date.html\">date</a>","id":"Morebits.date","children":[]},{"label":"<a href=\"Morebits.ip.html\">ip</a>","id":"Morebits.ip","children":[]},{"label":"<a href=\"Morebits.quickForm.html\">quickForm</a>","id":"Morebits.quickForm","children":[{"label":"<a href=\"Morebits.quickForm.element.html\">element</a>","id":"Morebits.quickForm.element","children":[]}]},{"label":"<a href=\"Morebits.select2.html\">select2</a>","id":"Morebits.select2","children":[]},{"label":"<a href=\"Morebits.simpleWindow.html\">simpleWindow</a>","id":"Morebits.simpleWindow","children":[]},{"label":"<a href=\"Morebits.status.html\">status</a>","id":"Morebits.status","children":[]},{"label":"<a href=\"Morebits.string.html\">string</a>","id":"Morebits.string","children":[]},{"label":"<a href=\"Morebits.taskManager.html\">taskManager</a>","id":"Morebits.taskManager","children":[]},{"label":"<a href=\"Morebits.unbinder.html\">unbinder</a>","id":"Morebits.unbinder","children":[]},{"label":"<a href=\"Morebits.userspaceLogger.html\">userspaceLogger</a>","id":"Morebits.userspaceLogger","children":[]},{"label":"<a href=\"Morebits.wiki.html\">wiki</a>","id":"Morebits.wiki","children":[{"label":"<a href=\"Morebits.wiki.api.html\">api</a>","id":"Morebits.wiki.api","children":[]},{"label":"<a href=\"Morebits.wiki.page.html\">page</a>","id":"Morebits.wiki.page","children":[]},{"label":"<a href=\"Morebits.wiki.preview.html\">preview</a>","id":"Morebits.wiki.preview","children":[]}]},{"label":"<a href=\"Morebits.wikitext.html\">wikitext</a>","id":"Morebits.wikitext","children":[{"label":"<a href=\"Morebits.wikitext.page.html\">page</a>","id":"Morebits.wikitext.page","children":[]}]}]},{"label":"<a href=\"external-HTMLFormElement.html\">HTMLFormElement</a>","id":"external:HTMLFormElement","children":[]},{"label":"<a href=\"external-RegExp.html\">RegExp</a>","id":"external:RegExp","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: false,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);

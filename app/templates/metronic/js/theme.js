var Template = {};
Template.navbarOptions = {};
Template.themeOptions = {};
Template.dialogOptions = {};

/**
 * Start FULL Admin Template
 */
Template.start = function() {
    Template.connectMenu();
    
    if (Template.navbarOptions['has_menu_mode_switch'] == '1') {
        document.documentElement.setAttribute('data-menu-theme', Template.getMenuTheme());
    }
    
    if (Template.navbarOptions['has_main_mode_switch'] == '1') {
        document.documentElement.setAttribute('data-bs-theme', Template.getGlobalTheme());
    }
    
    // compatibility for jquery-ui with new BS5
    if ($.fn.button && $.fn.button.noConflict) {
        var bootstrapButton = $.fn.button.noConflict();
        $.fn.bootstrapBtn = bootstrapButton;
    }
    
    if ($.fn.editInPlace) {
        $.fn.editInPlace.defaults['bg_over'] = 'var(--bs-secondary-bg-subtle)';
    }
    
    // enable page tabs
    if (Template.navbarOptions['allow_page_tabs'] == '1') {
        Template.restorePageTabsLocalStorage();
    }
    
    // activate item from query string
    Template.findQueryStringMenuItem( true );
    
    // set select2 language
    if ($.fn.select2 && Adianti && Adianti.language) {
        try {
            $.fn.select2.defaults.set('language', $.fn.select2.amd.require("select2/i18n/" + Adianti.language));
        } catch (e) {
            console.log(e);
        }
    }
}

/**
 * Start reduced Template inside IFRAME
 */
Template.startIframe = function() {
    if ($.fn.button && $.fn.button.noConflict) {
        var bootstrapButton = $.fn.button.noConflict();
        $.fn.bootstrapBtn = bootstrapButton;
    }
    
    // set themes in the root html inside iframe
    document.documentElement.setAttribute('data-menu-theme', Template.getMenuTheme());
    document.documentElement.setAttribute('data-bs-theme', Template.getGlobalTheme());
    
    if ($.fn.editInPlace) {
        $.fn.editInPlace.defaults['bg_over'] = 'var(--bs-secondary-bg-subtle)';
    }
}

/**
 * Intercept content before renderer
 */
Template.onBeforeLoadContent = function(content, partial_load = false) {
    Adianti.requestDump = '';
    
    var found = false;
    var limit = 10000;
    
    while ( (content.indexOf('<adump>') >= 0) && limit > 0) {
        Adianti.requestDump += __adianti_string_get_between(content, '<adump>', '</adump>', true);
        var dump_contents = __adianti_string_get_between(content, '<adump>', '</adump>', false);
        content = content.replace(dump_contents, '');
        
        found = true;
        limit --;
    }
    
    if (partial_load && (typeof Template.updateDebugPanel == 'function')) {
        Template.updateDebugPanel();
    }
    return content;
}

/**
 * Hook after page loading
 */
Template.onAfterLoad = function(url, data) {
    Template.updateDebugPanel();
    
    let url_container = url.match('target_container=([0-z-]*)');
    let dom_container = data.match('adianti_target_container\\s?=\\s?"([0-z-]*)"');
    let into_right_panel = false;
    
    if (url_container || dom_container) {
        let id = '';
        if (url_container) {
            id = url_container[1];
        }
        else if (dom_container) {
            id = dom_container[1];
        }

       into_right_panel = $('#' + id).closest('#adianti_right_panel').length > 0;
    }
    
    if ((url.indexOf('target_container=adianti_right_panel') !== -1) || (data.indexOf('adianti_target_container="adianti_right_panel"') !== -1) ) {
        if (data.indexOf('override="true"') !== -1) {
            $('#adianti_right_panel').find('[page_name]').not(':last').remove();
        }
        
        if ($( window ).width() >= 800) {
            Template.stackRightPanels();
        }
        
        if ($('#adianti_right_panel').is(":visible") == false) {
            $('body').css("overflow", "hidden");
            $('#adianti_right_panel').show('slide',{direction:'right'}, 320);
        }
        
        if ($('#adianti_right_panel').find('[page_name]').length > 1) {
            let current_page_name = ($('#adianti_right_panel').find('[page_name]').last().attr('page_name'));
            if (data.indexOf('page_name="'+current_page_name+'"') == -1)
            {
                $('#adianti_right_panel').find('[page_name]').last().hide();
                $('#adianti_right_panel').find('[page_name]').last().show('slide',{direction:'right'}, 320);
            }
        }
        
        var warnings = $('#adianti_right_panel').clone().find('div[page_name],script').remove().end().html();
        $('#adianti_right_panel').find('[page_name]').last().prepend(warnings);
        $("#adianti_right_panel").animate({ scrollTop: 0 }, "fast");
    }
    else if ( (url.indexOf('&static=1') == -1) && (data.indexOf('widget="TWindow"') == -1) && ! into_right_panel ) {
        if ($('#adianti_right_panel').is(":visible")) {
            $('#adianti_right_panel').hide();
            $('body').css("overflow", "auto");
            $('#adianti_right_panel').html('');
        }
    }
}

/**
 * Stack right panels
 */
Template.stackRightPanels = function() {
    var count = $('#adianti_right_panel').find('[page_name]').length;
    var base_width = count > 1 ? 40 : 0;
    var right_offset = 0;
    
    $('#adianti_right_panel').css('width', 'calc(50% + ' + (count * base_width) + 'px)');
    
    $('#adianti_right_panel').find('[page_name]').each(function(k,v) {
        var width = 'calc(100% - ' + ( (count - k - 1) * base_width) + 'px)';
        $(v).css('width', width);
        $(v).css('left', right_offset + 'px');
        right_offset += base_width;
    });
}

/**
 * Connect main menu actions
 */
Template.connectMenu = function() {
    $('.menu-link[generator="adianti"]').click(function(el) {
        $('.menu-link[generator="adianti"]').removeClass('active');
        
        var link = $(el.target).closest('a');
        link.addClass('active');
    });
}

/**
 * Update debug panel
 */
Template.updateDebugPanel = function() {
    try {
        var url  = Adianti.requestURL;
        var body = Adianti.requestData;
        var dumps = Adianti.requestDump;
        
        if (url) {
            url = url.replace('engine.php?', '');
            $('#request_url_panel').html( pretty.json.print(__adianti_query_to_json(urldecode(url)), undefined, 4) );
        }
        if (body) {
            $('#request_data_panel').html( pretty.json.print(__adianti_query_to_json(urldecode(body)), undefined, 4) );
        }
        $('#request_dump_panel').html( dumps );
    }
    catch (e) {
        console.log(e);
    }
}

/**
 * Create page tab from menu click
 */
Template.createPageTabFromMenu = function(element) {
    var link  = $(element).closest('a.menu-link');
    var href  = link.attr('href') + '&template=iframe';
    
    var found = false;
    
    // switch to tab view
    $('#adianti_div_content').hide();
    $('#adianti_tab_content_wrapper').show();
    
    // try to find iframe
    $('#adianti_tab_content_wrapper iframe').hide();
    $('#adianti_tab_content_wrapper iframe').each(function(k,v) {
        if (href == $(v).attr('src')) {
            $(v).show();
            found = true;
        }
    });
    
    // create item and iframe
    if (!found) {
        var label = link.find('.menu-title').text();
        
        // create tab and iframe
        Template.createPageTab(label, href);
        __adianti_process_tooltips();
    }
    
    // activate the item in tab menu
    $('#adianti_tab_content .nav-link').removeClass('active');
    $('#adianti_tab_content .nav-link[data-href="'+href+'"]').addClass('active');
    
    // activate the item in the side menu
    $('.menu-link[generator="adianti"]').removeClass('active');
    link.addClass('active');
    
    // localstorage control
    Template.updatePageTabsLocalStorage();
}

/**
 * Create page tab content
 */
Template.createPageTab = function(label, href) {
    var close_label = (typeof Application !== 'undefined' && Application.translation && Application.translation[Adianti.language]) ? Application.translation[Adianti.language]['close'] : 'Close';
    
    // create new item (Metronic styles)
    var new_tab = $('<div class="d-flex align-items-center me-3 tab-item"><a data-iframed=true data-href="'+href+'" class="nav-link text-gray-700 text-hover-primary py-2 px-3" onclick="Template.openPageTab(\''+href+'\')">' + label + '</a><a style="cursor:pointer;padding-left:0.5rem" title="'+close_label+'" onclick="Template.closePageTab(this)"><i class="fa-solid fa-xmark text-danger"></i></a></div>');
    $('#adianti_tab_content').append(new_tab);
    
    // create new iframe
    $('#adianti_tab_content_wrapper iframe').hide();
    var iframe = $('<iframe src="' + href + '" style="width:100%;height:calc(100vh - 200px);border:none;"></iframe>');
    $('#adianti_tab_content_wrapper .container-fluid').append(iframe);
    
    // clear main div and first page tab, if equals to the newly created tab 
    if (href.replace('&template=iframe', '') == $('#adianti_tab_content .nav-link:first').data('href') ) {
        Template.setFirstPageTabInfo('', '');
        $('#adianti_div_content').html('');
    }
}

/**
 * Open page tab
 */
Template.openPageTab = function(href, from_side_bar_click) {
    var found = false;
    
    // hide all iframes
    $('#adianti_tab_content_wrapper iframe').hide();
    $('#adianti_tab_content_wrapper iframe').each(function(k,v) {
        if (href == $(v).attr('src')) {
            $(v).show();
            
            // switch to tab view
            $('#adianti_div_content').hide();
            $('#adianti_tab_content_wrapper').show();
            
            // activate the item in tab menu
            $('#adianti_tab_content .nav-link').removeClass('active');
            $('#adianti_tab_content .nav-link[data-href="'+href+'"]').addClass('active');
            
            found = true;
            
            if (from_side_bar_click) {
                Template.setFirstPageTabInfo('', '');
                $('#adianti_div_content').html('');
            }
        }
    });
    
    return found;
}

/**
 * Close page tab
 */
Template.closePageTab = function(generator) {
    var page = $(generator).parent().find('a.nav-link');
    if (page.length > 0) {
        var href = page.data('href');
        if (page.data('iframed')) {
            $(generator).parent().remove();
            $('iframe[src="'+href+'"]').remove();
            
            Template.goLastPageTab();
        }
    }
    
    Template.updatePageTabsLocalStorage();
}

/**
 * Go to first page tab
 */
Template.goFirstPageTab = function() {
    $('#adianti_tab_content .nav-link').removeClass('active');
    $('#adianti_tab_content .nav-link:first').addClass('active');
    
    $('#adianti_div_content').show();
    $('#adianti_tab_content_wrapper').hide();
}

/**
 * Go to last page tab
 */
Template.goLastPageTab = function() {
    $('#adianti_tab_content .nav-link').removeClass('active');
    $('#adianti_tab_content .nav-link:not(.close):last').addClass('active');
    
    var iframed = $('#adianti_tab_content .nav-link:not(.close):last').data('iframed');
    var href = $('#adianti_tab_content .nav-link:not(.close):last').data('href');
    
    if (iframed)
    {
        $('#adianti_tab_content_wrapper iframe').hide();
        $('#adianti_tab_content_wrapper iframe').each(function(k,v) {
            if (href == $(v).attr('src')) {
                $(v).show();
            }
        });
    }
    else
    {
        $('#adianti_div_content').show();
        $('#adianti_tab_content_wrapper').hide();
    }
}

/**
 * Update local storage with page tabs
 */
Template.updatePageTabsLocalStorage = function() {
    var list = [];
    $('#adianti_tab_content .nav-link[data-iframed]').each(function(k,v) {
        list.push( { href: $(v).data('href'), label: $(v).text() } );
    });
    let appname = Adianti.applicationName || '';
    localStorage.setItem(appname+".page-tabs", JSON.stringify(list));
}

/**
 * Recreate page tabs from local storage
 */
Template.restorePageTabsLocalStorage = function() {
    let appname = Adianti.applicationName || '';
    var local_tabs_json = localStorage.getItem(appname+".page-tabs");
    if (local_tabs_json) {
        var local_tabs = JSON.parse(local_tabs_json);
        for (tab of local_tabs)
        {
            Template.createPageTab( tab['label'], tab['href']);
        }
    }
}

/**
 * Set first page tab information
 */
Template.setFirstPageTabInfo = function(label, url) {
    $('#adianti_tab_content .nav-link:first span').text(label);
    $('#adianti_tab_content .nav-link:first').data('href', url);
}

/**
 * Toggle global theme
 */
Template.toggleGlobalTheme = function(generator) {
    let next = ($(generator).is(":checked")) ? 'dark' : 'light';
    let appname = Adianti.applicationName || '';
    
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem(appname+".bs-theme", next);
    
    Template.setIFrameGlobalTheme(next);
    if (typeof Template.updateChartsMode == 'function') {
        Template.updateChartsMode();
    }
}

/**
 * Toggle menu theme
 */
Template.toggleMenuTheme = function(generator) {
    let next = ($(generator).is(":checked")) ? 'dark' : 'light';
    let appname = Adianti.applicationName || '';
    
    document.documentElement.setAttribute('data-menu-theme', next);
    localStorage.setItem(appname+".menu-theme", next);
    
    Template.setIFrameMenuTheme(next);
}

/**
 * Returns global theme
 */
Template.getGlobalTheme = function() {
    let appname = Adianti.applicationName || '';
    return ( localStorage.getItem(appname+".bs-theme") !== null ) ? localStorage.getItem(appname+".bs-theme") : $(document.documentElement).data('bs-theme');
}

/**
 * Returns menu theme
 */
Template.getMenuTheme = function() {
    let appname = Adianti.applicationName || '';
    return ( localStorage.getItem(appname+".menu-theme") !== null ) ? localStorage.getItem(appname+".menu-theme") : $(document.documentElement).data('menu-theme');
}

/**
 * Change global theme in all IFRAMEs
 */
Template.setIFrameGlobalTheme = function(theme) {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.documentElement.dataset.bsTheme = theme;
        } catch (error) {
            console.warn(error);
        }
    });
}

/**
 * Change menu theme in all IFRAMEs
 */
Template.setIFrameMenuTheme = function(theme) {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.documentElement.dataset.menuTheme = theme;
        } catch (error) {
            console.warn(error);
        }
    });
}

/**
 * Set NAVBAR options
 */
Template.setNavbarOptions = function(options) {
    Template.navbarOptions = options;
    
    if ((options['has_program_search'] == '1') && ($("#navbar-wrapper").length > 0) && ($('html').data('public') !== 'yes')) {
        $.get("engine.php?class=SearchBox", function(data) {
            $("#navbar-wrapper").append(data);
        });
    }
    
    if (options['allow_page_tabs'] == '1') {
        $('.adianti_tabs_container').show();
        $('#adianti_tab_content').show();
    }
}

/**
 * Set theme options
 */
Template.setThemeOptions = function(options) {
    Template.themeOptions = options;
    
    if (options['menu_mode']) {
        let appname = Adianti.applicationName || '';
        if (localStorage.getItem(appname+".menu-theme") == null || Template.navbarOptions['has_menu_mode_switch'] == '0') {
            document.documentElement.setAttribute('data-menu-theme', options['menu_mode']);
        }
    }
    
    if (options['main_mode']) {
        let appname = Adianti.applicationName || '';
        if (localStorage.getItem(appname+".bs-theme") == null || Template.navbarOptions['has_main_mode_switch'] == '0') {
            document.documentElement.setAttribute('data-bs-theme', options['main_mode']);
        }
        
        Template.setIFrameGlobalTheme(options['main_mode']);
        Template.setIFrameMenuTheme(options['menu_mode']);
    }
}

/**
 * Set dialog options
 */
Template.setDialogOptions = function(options) {
    Template.dialogOptions = options;
    
    if (options['use_swal'] == '1' && typeof Swal !== 'undefined') {
        window.__adianti_dialog_std = __adianti_dialog;
        
        window.__adianti_dialog = function( options ) {
            setTimeout( function() {
                if ($('.swal2-container').length == 0 || $('.swal2-container>div.swal2-icon-question').length == 1) {
                    Swal.fire({
                      title: options.title,
                      html: options.message,
                      icon: options.type,
                      allowEscapeKey: true,
                      allowOutsideClick: true
                    }).then((result) => {
                      if (result.isConfirmed || typeof (result.dismiss !== 'undefined')) {
                        if (typeof options.callback != 'undefined') {
                            options.callback();
                        }
                      }
                    });
                }
                else if ( ($('#swal2-title').html() !== options.title) || $('#swal2-html-container').html() !== options.message) {
                    window.__adianti_dialog_std( options );
                }
            }, 100);
        }
        
        window.__adianti_message = function(title, message, callback) {
            __adianti_dialog( { type: 'success', title: title, message: message, callback: callback} );
        }
        
        window.__adianti_question = function(title, message, callback_yes, callback_no, label_yes, label_no) {
            setTimeout( function() {
                Swal.fire({
                  title: title,
                  html: message,
                  icon: 'question',
                  showDenyButton: true,
                  confirmButtonText: label_yes,
                  denyButtonText: label_no
                }).then((result) => {
                  if (result.isConfirmed) {
                    if (typeof callback_yes != 'undefined') {
                        callback_yes();
                    }
                  } else if (result.isDenied) {
                    if (typeof callback_no != 'undefined') {
                        callback_no();
                    }
                  }
                });
            }, 100);
        }
    }
}

/**
 * Configure template
 */
Template.configure = function(options, context = 'main') {
    Template.options = options;
    if (context !== 'login') {
        Template.setNavbarOptions(options['navbar'] ?? {});
        Template.setThemeOptions(options['theme'] ?? {});
    }
    
    Template.setDialogOptions(options['dialogs'] ?? {});
}

/**
 * Return configured options
 */
Template.getConfigureOptions = function() {
    return Template.options;
}

/**
 * Trigger click after timeout
 */
Template.triggerClick = function(selector, timeout) {
    $(document).ready(function() {
        function tryTriggerClick() {
            if ($.active === 0) {
                if (Template.timeoutId) {
                    clearTimeout(Template.timeoutId);
                }

                Template.timeoutId = setTimeout(function() {
                    $(selector).click();
                    Template.timeoutId = null;
                }, timeout);
            } else {
                setTimeout(tryTriggerClick, 100);
            }
        }

        tryTriggerClick();
    });
};
Template.findQueryStringMenuItem = function( click ) {
    var query = window.location.search.substring(1);
    var appname = Adianti.applicationName || '';
    if (query)
    {
        var parts = query.split('&');
        var class_name = '';
        var method_name = '';
        for (var i = 0; i < parts.length; i++) {
            var key_val = parts[i].split('=');
            if (key_val[0] == 'class') {
                class_name = key_val[1];
            }
            else if (key_val[0] == 'method') {
                method_name = key_val[1];
            }
        }
        if (class_name) {
            var href = 'index.php?class=' + class_name + (method_name ? '&method='+method_name : '');
            var link = $('.menu-link[href="'+href+'"]');
            if (link.length > 0) {
                $('.menu-link[generator="adianti"]').removeClass('active');
                link.addClass('active');
                if (click) {
                    link.click();
                }
            }
        }
    }
};

/* This is my testversion of AzaToth's Twinkle. I use it to test Safari compatibility. 
  *  It uses a hack to force a loadsequence for webkit users.
  *  https://bugs.webkit.org/show_bug.cgi?id=28328 */

importScript('User:AzaToth/morebits.js');
var interval_id = setInterval( "checkLoaded()", 50 );
var interval_count = 0;

function checkLoaded() {
    if( interval_count == 100 ) {
        clearInterval( interval_id );
        throw "Failed to load morebits.js (timeout after 5 seconds)";
        return;
    } else if( typeof( morebits_js_loaded  ) != 'undefined' && morebits_js_loaded ) {
        clearInterval( interval_id );
        importScript('User:AzaToth/twinklefluff.js');
        importScript('User:AzaToth/twinklewarn.js');
        importScript('User:AzaToth/twinklearv.js');
        importScript('User:AzaToth/twinklespeedy.js');
        importScript('User:AzaToth/twinklediff.js');
        importScript('User:AzaToth/twinkleprotect.js');
        importScript('User:AzaToth/twinkleprod.js');
        importScript('User:AzaToth/twinklexfd.js');
        importScript('User:AzaToth/twinkleimage.js');
        importScript('User:AzaToth/twinkleunlink.js');
        importScript('User:AzaToth/twinkledelimages.js');
        importScript('User:AzaToth/twinkledeprod.js');
        importScript('User:AzaToth/twinklebatchdelete.js');
        importScript('User:AzaToth/twinklebatchprotect.js');
        importScript('User:AzaToth/twinkleimagetraverse.js');
        importScript('User:AzaToth/twinklebatchundelete.js');
    }
    interval_count++;
}
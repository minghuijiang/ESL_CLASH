/**
 * Created by MingJiang on 4/24/2015.
 */
function adminOnlyBinding(){
    registerDel('leftUser','userLeftButton','rightUser','userRightButton');
    //delete class loading
    bindLoad('reloadClass','leftClass','api/listClass?',function(obj){
        return [obj.CLASSNAME,obj.CRN];
    });
    $('#submitDeleteClass').on('click',function(ev){
        var item =  $("#leftClass option:selected")[0].value;
        $.get('api/delClass?crn='+item,function(data){
            if(data.error){
                if(data.error.code)
                    showError(data.error.code);
                else
                    showError(data.error);
            }else{
                item.remove();
            }
        })
    });
}
adminOnlyBinding();
$( "#main-tabs" ).tabs( "option", "active", 3 );

export default function printRows(width)
{
    let rowNum = 6;

    if(width < '736') {
        rowNum = 1;
    }else if(width <= '768' && width >= '736') {
        rowNum = 2;
    }else if(width <= '1023' && width >= '768') {
        rowNum = 3;
    }else if(width >= '1024'){
        rowNum = 4;
    }else if(width >= '1439'){
        rowNum = 5;
    }

    return rowNum;
}
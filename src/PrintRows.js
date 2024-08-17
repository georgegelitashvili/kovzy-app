export default function printRows(width)
{
    let rowNum = 5;

    if (width < 736) {
        rowNum = 1;
    } else if (width <= 768 && width >= 736) {
        rowNum = 2;
    } else if (width <= 1023 && width >= 769) {
        rowNum = 3;
    } else if (width <= 1439 && width >= 1024) {
        rowNum = 3;
    } else if (width >= 1440) {
        rowNum = 4;
    }

    return rowNum;
}
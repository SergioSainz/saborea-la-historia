/**
 * Segundo Plato - TypeIt poem initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    new TypeIt("#poema-revolucion", {
        strings: ['"En fogones de campaña,<br>el maíz hervía al calor,<br>las Adelitas servían fuerza,<br>en tortilla y en frijol.<br><br>Mientras el Porfiriato brindaba,<br>con pasteles y champán,<br>el pueblo luchaba en barro,<br>con un taco en la mano y pan.<br><br>Porque la revolución ardió,<br>no en salones dorados y finos,<br>sino en el Tlecuilli encendido,<br>y en fogones campesinos."'],
        speed: 20,
        waitUntilVisible: true,
        cursor: true,
        lifeLike: false
    }).go();
});

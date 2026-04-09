function salvarproduto() {
    var modelo = document.getElementById('modelo').value;
    var preco = document.getElementById('preco').value;
    var imagem = document.getElementById('imagem').files[0];

    var formData = new FormData();
    formData.append('modelo', modelo);
    formData.append('preco', preco);
    formData.append('imagem', imagem);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'salvarproduto.php', true);

    xhr.onload = function() {
        if (xhr.status === 200) {
            // Lógica para lidar com a resposta do servidor, se necessário
            console.log(xhr.responseText);
        }
    };

    xhr.send(formData);
}

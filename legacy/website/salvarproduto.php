<?php
// Conexão com o banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

$mysqli = mysqli_connect($servername, $username, $password, $dbname);

if ($mysqli->error) { // Verifica se ocorreu algum erro ao conectar ao banco de dados
    die("Falha ao conectar ao banco de dados: " . $mysqli->error); // Se houver um erro, exibe uma mensagem de erro e interrompe o script usando a função die().
}

// Obter dados do formulário
$modelo = $_POST['modelo'];
$preco = $_POST['preco'];
$imagem = $_FILES['imagem']['name'];
$tempImagem = $_FILES['imagem']['tmp_name'];

// Mover a imagem para o diretório desejado
move_uploaded_file($tempImagem, 'localhost/phpmyadmin/index.php?route=/table/structure&db=ecomerce&table=roupa' . $imagem);

// Inserir dados na tabela
$sql = "INSERT INTO roupa (modelo, preco, imagem) VALUES ('$modelo', '$preco', '$imagem')";

if ($mysqli->query($sql) === TRUE) {
    echo "Produto inserido com sucesso!";
} else {
    echo "Erro: " . $sql . "<br>" . $mysqli->error;
}

$mysqli->close();
?>

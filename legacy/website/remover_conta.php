<?php
// Conexão com o banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}

// Obtém o ID da conta a ser removida
$id = $_POST['id'];

// Consulta SQL para excluir a conta
$sql = "DELETE FROM users WHERE id=$id";

if ($conn->query($sql) === TRUE) {
    echo "Conta removida com sucesso!";
} else {
    echo "Erro ao remover conta: " . $conn->error;
}

$conn->close();
?>

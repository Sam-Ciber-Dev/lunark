<?php
// Verificar se o ID do produto está definido na URL
if(isset($_GET['id'])) {
    // Conexão com o banco de dados
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "ecomerce";

    // Criar conexão
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Verificar conexão
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    // Preparar a declaração SQL para excluir o produto do carrinho com base no ID fornecido
    $stmt = $conn->prepare("DELETE FROM cart WHERE id = ?");
    $stmt->bind_param("i", $_GET['id']);

    // Executar a declaração SQL
    if ($stmt->execute()) {
        echo "<script>window.location.href = 'cart.php';</script>";
    } else {
        echo "Erro ao remover o produto do carrinho: " . $conn->error;
    }

    // Fechar a declaração e a conexão
    $stmt->close();
    $conn->close();
} else {
    echo "ID do produto não especificado.";
}
?>

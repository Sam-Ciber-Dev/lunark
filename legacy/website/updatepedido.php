<?php
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if form data is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $id = $_POST["id"];
    $imagem = $_POST["imagem"];
    $produto = $_POST["produto"];
    $preco = $_POST["preco"];
    $quantidade = $_POST["quantidade"];
    $total = $_POST["total"];
    $tamanho = $_POST["tamanho"];
    $id_utilizador = $_POST["id_utilizador"];

    // Update cart item in the database
    $sql = "UPDATE cart SET imagem='$imagem', produto='$produto', preco='$preco', quantidade='$quantidade', total='$total', tamanho='$tamanho', id_utilizador='$id_utilizador' WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        // Redirect back to products page
        header("Location: visualizarpedidos.php");
        exit(); // Ensure script execution stops after redirection
    } else {
        echo "Erro ao atualizar o pedido: " . $conn->error;
    }
}

// Close connection
$conn->close();
?>

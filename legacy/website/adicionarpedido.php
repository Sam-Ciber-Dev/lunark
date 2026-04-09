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

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $imagem = $_POST["imagem"];
    $produto = $_POST["produto"];
    $preco = $_POST["preco"];
    $quantidade = $_POST["quantidade"];
    $total = $preco * $quantidade; // Calculate total
    $tamanho = $_POST["tamanho"];

    // Assuming you have a way to select the user ID
    $id_utilizador = $_POST["id_utilizador"];

    // Insert new pedido into the database
    $sql = "INSERT INTO cart (imagem, produto, preco, quantidade, total, tamanho, id_utilizador)
            VALUES ('$imagem', '$produto', '$preco', '$quantidade', '$total', '$tamanho', '$id_utilizador')";

    if ($conn->query($sql) === TRUE) {
        echo "Pedido adicionado com sucesso.";
    } else {
        echo "Erro ao adicionar o pedido: " . $conn->error;
    }

    // Close connection
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adicionar Pedido</title>
</head>
<body>
    <h2>Adicionar Pedido</h2>
    <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
        Imagem: <input type="text" name="imagem" required><br><br>
        Produto: <input type="text" name="produto" required><br><br>
        Preço: <input type="number" name="preco" required><br><br>
        Quantidade: <input type="number" name="quantidade" required><br><br>
        Tamanho: <input type="text" name="tamanho" required><br><br>
        <!-- Retrieve user IDs from the cart table -->
        ID Utilizador:
        <select name="id_utilizador" required>
            <?php
            // Retrieve user IDs from the cart table
            $user_query = "SELECT DISTINCT id_utilizador FROM cart";
            $user_result = $conn->query($user_query);

            if ($user_result->num_rows > 0) {
                while ($row = $user_result->fetch_assoc()) {
                    echo "<option value='" . $row["id_utilizador"] . "'>" . $row["id_utilizador"] . "</option>";
                }
            } else {
                echo "<option value=''>Nenhum usuário encontrado</option>";
            }
            ?>
        </select>
        <br><br>
        <input type="submit" value="Adicionar Pedido">
        <a href="visualizarpedidos.php"><button type="button">Cancelar Alterações</button></a>
    </form>
</body>
</html>
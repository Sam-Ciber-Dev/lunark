<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Produto</title>
    <style>
form, table {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

form label {
    font-weight: bold;
    margin-bottom: 5px;
    display: block;
}

form input[type="text"],
form input[type="file"] {
    width: calc(100% - 22px);
    padding: 10px;
    margin: 5px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
}

form input[type="submit"],
form button[type="button"] {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
}

form input[type="submit"]:hover,
form button[type="button"]:hover {
    background-color: #45a049;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

table th, table td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

table th {
    text-align: left;
    background-color: #f2f2f2;
}
    </style>
</head>
<body>

<?php
// Conectar ao banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

$conexao = new mysqli($servername, $username, $password, $dbname);

// Verificar a conexão
if ($conexao->connect_error) {
    die("Falha na conexão: " . $conexao->connect_error);
}

// Verificar se um ID de produto foi fornecido na URL
if (!isset($_GET['id'])) {
    echo "ID do produto não fornecido.";
    exit();
}

$id_produto = $_GET['id'];

// Consulta SQL para obter detalhes do produto
$consultaProduto = "SELECT * FROM roupa WHERE id='$id_produto'";
$resultadoProduto = $conexao->query($consultaProduto);

if ($resultadoProduto->num_rows == 1) {
    $produto = $resultadoProduto->fetch_assoc();
?>
<h2>Tabela do Produto</h2>
<table>
    <tr>
        <th>Modelo</th>
        <td><?php echo $produto['modelo']; ?></td>
    </tr>
    <tr>
        <th>Preço</th>
        <td><?php echo $produto['preco']; ?></td>
    </tr>
    <tr>
        <th>Imagem</th>
        <td><img src="img/<?php echo $produto['imagem']; ?>" alt="Imagem do Produto" style="max-width: 200px;"></td>
    </tr>
</table>
<br>
<h3>Editar Produto</h3>
<form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]) . "?id=" . $id_produto; ?>" method="post" enctype="multipart/form-data">
    <label for="modelo">Novo Modelo:</label><br>
    <input type="text" id="modelo" name="modelo" value="<?php echo $produto['modelo']; ?>"><br>
    <label for="preco">Novo Preço:</label><br>
    <input type="text" id="preco" name="preco" value="<?php echo $produto['preco']; ?>"><br>
    <label for="imagem">Nova Imagem:</label><br>
    <input type="file" id="imagem" name="imagem"><br><br>
    <input type="submit" value="Salvar Alterações">
    <a href="atualizarproduto.php"><button type="button">Cancelar Alterações</button></a>
</form>


<?php
} else {
    echo "Produto não encontrado.";
}

// Processar a atualização do produto
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Pegar os novos dados do formulário
    $modelo = $_POST['modelo'];
    $preco = $_POST['preco'];

    // Verificar se uma nova imagem foi enviada
    if ($_FILES['imagem']['size'] > 0) {
        // Diretório onde as imagens serão armazenadas
        $diretorio = "img/";

        // Nome do arquivo temporário da imagem
        $imagem_temp = $_FILES['imagem']['tmp_name'];

        // Nome do arquivo da imagem
        $imagem_nome = $_FILES['imagem']['name'];

        // Caminho completo para o arquivo da imagem
        $imagem_destino = $diretorio . $imagem_nome;

        // Mover o arquivo da imagem para o diretório de destino
        if (move_uploaded_file($imagem_temp, $imagem_destino)) {
            // Preparar e executar a consulta SQL para atualizar o produto com a nova imagem
            $consultaEditar = "UPDATE roupa SET modelo='$modelo', preco='$preco', imagem='$imagem_nome' WHERE id='$id_produto'";
            if ($conexao->query($consultaEditar) === TRUE) {
                echo "<script>alert('Produto editado com sucesso!');</script>";
            } else {
                echo "<script>alert('Erro ao editar o produto: " . $conexao->error . "');</script>";
            }
        } else {
            echo "<script>alert('Erro ao fazer o upload da imagem.');</script>";
        }
    } else {
        // Preparar e executar a consulta SQL para atualizar o produto sem alterar a imagem
        $consultaEditar = "UPDATE roupa SET modelo='$modelo', preco='$preco' WHERE id='$id_produto'";
        if ($conexao->query($consultaEditar) === TRUE) {
            echo "<script>alert('Produto editado com sucesso!');</script>";
            header("Location: atualizarproduto.php");
        } else {
            echo "<script>alert('Erro ao editar o produto: " . $conexao->error . "');</script>";
        }
    }
}
?>

</body>
</html>

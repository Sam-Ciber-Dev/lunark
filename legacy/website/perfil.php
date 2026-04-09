<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DropBox</title>
    <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" />
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
            margin-bottom: 20px;
            color: #333;
        }

        p {
            margin-bottom: 10px;
        }

        strong {
            font-weight: bold;
        }

        .logout-btn {
            background-color: #ff5733;
            color: #fff;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .logout-btn:hover {
            background-color: #ff6b4a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #f2f2f2;
        }

        img {
            max-width: 50px;
            height: auto;
        }
    </style>
</head>
<body>

<?php
// Iniciar a sessão
session_start();

// Verificar se o usuário está logado
if (!isset($_SESSION['nome'])) {
    // Se não estiver logado, redirecionar para a página de login
    header("Location: login.php");
    exit;
}

// Definir a variável para controlar a classe 'active' para o link "Minha Conta"
$activeClass = 'class="active"';

// Conexão com o banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Obter dados do usuário logado
$nome = $_SESSION['nome'];

// Consulta SQL para selecionar os dados do usuário
$sql = "SELECT nome, email FROM users WHERE nome = '$nome'";
$result = $conn->query($sql);

?>
<section id="header">
    <a href="index.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a>
    
    <div>
        <ul id="navbar">
            <li><a href="index.php">Home</a></li>
            <li><a href="shop.php">Shop</a></li>
            <li><a href="about.php">About</a></li>
            <li><a <?php if(basename($_SERVER['PHP_SELF']) == 'contact.php') echo 'class="active"'; ?> href="contact.php">Contact</a></li>
            <li id="lg-bag"><a href="cart.php"><i class="fas fa-shopping-bag"></i></a></li>
            <li><a href='perfil.php' <?php echo $activeClass; ?>>Minha Conta</a></li>
        </ul>   
        <div id="mobile">
            <a  href="cart.php"><i class="fas fa-shopping-bag"></i></a>
            <i id="bar" class="fas fa-outdent"></i>
        </div>
    </div>
</section>

<div class="container">
    <?php
    if ($result->num_rows > 0) {
        // Exibir os dados do usuário
        echo "<h2>Perfil do Utilizador</h2>";
        $row = $result->fetch_assoc();
        echo "<p><strong>Nome:</strong> " . $row['nome'] . "</p>";
        echo "<p><strong>Email:</strong> " . $row['email'] . "</p>";

        // Adicionar botão de logout
        echo "<form action='logout.php' method='post'>";
        echo "<input type='submit' value='Terminar Sessão' class='logout-btn'>";
        echo "</form>";
    } else {
        echo "Nenhum dado encontrado.";
    }

    $conn->close();
    ?>
</div>



<?php
// Conectar ao banco de dados novamente para obter os dados do carrinho
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Verificar se a sessão do usuário está definida
if (isset($_SESSION['id'])) {
    // Consulta para obter os dados do carrinho associados ao usuário logado
    $user_id = $_SESSION['id'];
    $sql_carrinho = "SELECT id, imagem, produto, preco, tamanho, quantidade, total FROM cart WHERE id_utilizador = $user_id";
    $result_carrinho = $conn->query($sql_carrinho);

    // Exibir os dados do carrinho
    ?>
    <div>
        <h3>Produtos Adicionados ao Carrinho</h3>
        <br>
        <table>
            <thead>
                <tr>
                    <th>Imagem</th>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Tamanho</th>
                    <th>Quantidade</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <?php
                if ($result_carrinho->num_rows > 0) {
                    while ($row = $result_carrinho->fetch_assoc()) {
                        echo "<tr>";
                        echo "<td><img src='img/" . $row["imagem"] . "' width='50'></td>";
                        echo "<td>" . $row["produto"] . "</td>";
                        echo "<td>" . $row["preco"] . "€</td>";
                        echo "<td>" . $row["tamanho"] . "</td>";
                        echo "<td>" . $row["quantidade"] . "</td>";
                        echo "<td>" . $row["total"] . "€</td>";
                        echo "</tr>";
                    }
                } else {
                    echo "<tr><td colspan='6'>Nenhum item no carrinho.</td></tr>";
                }
                ?>
            </tbody>
        </table>
    </div>
    <?php
} else {
    echo "<p>Usuário não autenticado.</p>";
}
?>
    <!-- footer section -->
    <footer class="section-p1">
        <br>
        <br>
        <div class="col">
            <h4>Contato</h4>
            <p><strong>Morada:</strong> Não existe morada física </p>
            <p><strong>Telemóvel: </strong>+351 232 323 545</p>
        </div>

        <div class="col">
            <h4>Sobre nós</h4>
            <a href="about.php">Sobre nós</a>
            <a href="politicas.php">Políticas de Privacidade</a>
            <a href="contact.php">Contacte-nos</a>
        </div>

        <div class="col">
            <h4>Minha conta</h4>
            <a href="login.php">Login</a>
            <a href="cart.php">Ver carrinho</a>
            <a href="contact.php">Ajuda</a>
        </div>

        <div class="copyright">
            <p> © 2024- Todos os direitos reservados </p>
        </div>
    </footer>
    <!-- end of footer section -->
</body>
</html>

<?php
session_start();

if (!isset($_SESSION['nome'])) {
    echo "<p></p>"; // Exibir mensagem no navegador
    echo "<script>alert('Sem sessão iniciada. Inicie sessão numa conta');</script>";
    header("refresh:0;url=login.php"); // Redirecionar para a página de login após 2 segundos
    exit; // Parar a execução do script após o redirecionamento
}

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

$user_id = $_SESSION['id'];

// Consultar se existem dados de localização para o usuário atual
$sql = "SELECT * FROM localizacao WHERE id_utilizador = $user_id";
$result = $conn->query($sql);

// Verificar se há dados de localização
$has_location_data = ($result->num_rows > 0);

// Fechar conexão com o banco de dados
$conn->close();
?>

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
        /* Estilos CSS aqui */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        table, th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
        }

        .delete-btn {
            text-decoration: none;
            color: red;
        }
        form {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            max-width: 400px;
            margin: 0 auto;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;
        }

        input[type="submit"] {
            background-color: #088178;
            color: #fff;
            padding: 10px 20px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        input[type="submit"]:hover {
            background-color: #033f3b;
        }
    </style>
</head>
<body>
<!-- header section -->
<section id="header">
    <a href="index.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a>
    
    <div>
        <ul id="navbar">
            <li><a href="index.php">Home</a></li>
            <li><a href="shop.php">Shop</a></li>
            <li><a href="about.php">About</a></li>
            <li><a href="contact.php">Contact</a></li>
            <li id="lg-bag"><a class="active" href="cart.php"><i class="fas fa-shopping-bag"></i></a></li>
            <a href="#" id="close"><i class="far fa-times"></i></a>
            <?php
            // Verificar se uma sessão já está ativa
            // session_start(); // Remove this line since session_start() is already called at the beginning of the script
            // Verificar se o usuário está logado
            if (isset($_SESSION['nome'])) {
                // Se estiver logado, exibir o link "Minha Conta" e redirecionar para "perfil.php"
                echo "<li><a href='perfil.php'>Minha Conta</a></li>";
            } else {
                // Se não estiver logado, exibir o link de login
                echo "<li><a href='login.php' >Login</a></li>";
            }
            ?>
        </ul>   
    </div>
    <div id="mobile">
        <a  href="cart.php"><i class="fas fa-shopping-bag"></i></a>
        <i id="bar" class="fas fa-outdent"></i>
    </div>
</section>
<!-- end of header section -->


    <!-- Title section -->
    <section id="page-header" class="about-header">
        <h2>Carrinho</h2>
        <p>Finalise aqui as suas compras!</p>
    </section>
    <!-- End of Title section -->

    <br>
    <br>
    <br>
    <h3> Produtos adicionados ao carrinho </h3>
    <section>
        <table>
            <thead>
                <tr>
                    <th>Imagem</th>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Tamanho</th>
                    <th>Quantidade</th>
                    <th>Total</th>
                    <th>Ação</th> <!-- Nova coluna para o botão de exclusão -->
                </tr>
            </thead>
            <tbody>
                <?php
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

                // Consulta SQL para selecionar todos os registros da tabela "cart" associados ao usuário logado
                $user_id = $_SESSION['id']; // Assuming 'id' is the user ID in the session
                $sql = "SELECT id, imagem, produto, preco, tamanho, quantidade, total FROM cart WHERE id_utilizador = $user_id";
                $result = $conn->query($sql);

                // Verificar se existem resultados na consulta
                if ($result->num_rows > 0) {
                    // Exibir os dados em cada linha da tabela
                    while($row = $result->fetch_assoc()) {
                        echo "<tr>";
                        echo "<td><img src='img/" . $row["imagem"] . "' width='50'></td>";
                        echo "<td>" . $row["produto"] . "</td>";
                        echo "<td>" . $row["preco"] . "€</td>";
                        echo "<td>" . $row["tamanho"] . "</td>";
                        echo "<td>" . $row["quantidade"] . "</td>";
                        echo "<td>" . $row["total"] . "€</td>";
                        echo "<td><a href='delete_from_cart.php?id=" . $row["id"] . "' class='delete-btn'>&#10006;</a></td>"; // Adicionando o link de exclusão com o ícone de "x"
                        echo "</tr>";
                    }
                } else {
                    echo "<tr><td colspan='8'>Nenhum item no carrinho.</td></tr>";
                }
                ?>
            </tbody>
        </table>
    </section>


    <!-- Informações de Entrega -->
    <section>
        <br>
        <br>
        <div align="center"> 
            <h3>Informações de Entrega</h3>
            <?php if ($has_location_data) { ?>
                <p>Já foram inseridas informações de entrega para este usuário.</p>
            <?php } else { ?>
                <form action="processar_pedido.php" method="post">
                    <input type="hidden" name="user_id" value="<?php echo $_SESSION['id']; ?>">
                    <label for="destrito">Distrito:</label>
                    <input type="text" id="destrito" name="destrito"> <!-- Corrigido para "destrito" -->
                    <label for="conselho">Conselho:</label>
                    <input type="text" id="conselho" name="conselho">
                    <label for="codigopostal">Código Postal:</label>
                    <input type="text" id="codigopostal" name="codigopostal">
                    <input type="submit" value="Continuar" class="normal">
                </form>
            <?php } ?>
        </div>
    </section>


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

    <script src="script.js"></script>
</body>
</html>

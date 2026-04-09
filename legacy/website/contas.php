<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styleadmin.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">

    <style>
/* Estilo suave para a tabela de contas */
table {
    width: 100%;
    border-collapse: collapse;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

table td button {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
}

table td button:hover {
    background-color: #d32f2f;
}

               /* Estilos para o menu */
               .navigation {
            background-color: #333;
            width: 100%;
            padding: 15px 0;
            text-align: center;
        }

        .mainmenu {
            list-style-type: none;
            margin: 0;
            padding: 0;
            display: inline-block;
        }

        .mainmenu li {
            display: inline-block;
            margin-right: 20px;
        }

        .mainmenu li a {
            color: #fff;
            text-decoration: none;
            font-size: 18px;
            padding: 10px 20px;
            transition: background-color 0.3s;
        }

        .mainmenu li a:hover {
            background-color: #555;
        }

        .submenu {
            display: none;
            position: absolute;
            background-color: #333;
            z-index: 1;
            width: 200px;
        }

        .submenu li {
            display: block;
        }

        .submenu li a {
            color: #fff;
            text-decoration: none;
            padding: 10px;
            display: block;
        }

        .mainmenu li:hover .submenu {
            display: block;
        }
    </style>
</head>
<body>
    <!-- Menu section -->
    <section>
        <div class="navigation">
            <ul class="mainmenu">
            <li><a href="admin.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a></li>
                <li><a href="">Produtos</a>
                    <ul class="submenu">
                        <li><a href="adproduto.php">Adicionar</a></li>
                        <li><a href="atualizarproduto.php">Atualizar</a></li>
                    </ul>
                </li>
                <li><a href="">Pedidos</a>
                    <ul class="submenu">
                        <li><a href="visualizarpedidos.php">Visualizar pedidos</a></li>
                    </ul>
                </li>
                <li><a href="">Contas</a>
                    <ul class="submenu">
                        <li><a href="contas.php">Gerir contas</a></li>
                    </ul>
                </li>
                <li><a href="logout.php">Logout</a></li>
            </ul>
        </div>
        <br>
    </section>
    <!-- End of Menu section -->

    <!-- Contas section -->
    <h2>Contas</h2>

    <table>
        <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Senha</th>
            <th>Ações</th>
        </tr>

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
        // Consulta para obter todas as contas
        $sql = "SELECT * FROM users";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            // Exibir os resultados em uma tabela
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['nome'] . "</td>";
                echo "<td>" . $row['email'] . "</td>";
                echo "<td>" . $row['senha'] . "</td>";
                echo "<td><button onclick='removerConta(" . $row['id'] . ")'>Remover</button></td>";
                echo "</tr>";
            }
        } else {
            echo "<tr><td colspan='4'>Nenhuma conta encontrada</td></tr>";
        }
        $conn->close();
        ?>
    </table>

    <script>
        function removerConta(id) {
            if (confirm("Tem certeza que deseja remover esta conta?")) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'remover_conta.php', true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        // Recarrega a página após remover a conta
                        location.reload();
                    }
                };
                xhr.send('id=' + id);
            }
        }
    </script>
</body>
</html>

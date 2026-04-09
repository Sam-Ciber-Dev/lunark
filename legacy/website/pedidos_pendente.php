<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styleadmin.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">

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
    </style>
</head>

<body>
    <!-- Menu section -->
    <section>
        <a href="admin.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a>
        <nav class="navigation">
            <ul class="mainmenu">
                <li><a href="">Produtos</a>
                    <ul class="submenu">
                        <li><a href="adproduto.php">Adicionar </a></li>
                        <li><a href="atualizarproduto.php">Atualizar </a></li>
                    </ul>
                </li>
                <li><a href="">Pedidos</a>
                    <ul class="submenu">
                        <li><a href="">Visualizar pedidos</a></li>
                    </ul>
                </li>
                <li><a href="">Contas</a>
                    <ul class="submenu">
                        <li><a href="contas.php">Gerir contas</a></li>
                    </ul>
                </li>
                <li><a href="logout.php">Logout</a></li>
            </ul>
        </nav>
        <br>
    </section>
    <!-- End of Menu section -->
</body>
</html>

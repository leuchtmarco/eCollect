<?php
/* ---------- DB conenction ---------- */
function connect_db(){
	$link = mysqli_connect("localhost", "usr_web100", "01bafe31", "usr_web100_1", "3307", "/run/mysqld/mysqld10.sock")
		or die("Keine Verbindung moeglich: " . mysqli_error($link));
	return $link;
}
function close_db($link){
	mysqli_close($link);
}

/* ---------- Lists ---------- */
function set_list($values){
	$link = connect_db();
	if ($values['id0'] == -1)
		$sql = "INSERT INTO lists (id, public_id, user_id, password, public, name, description) VALUES (NULL, '{$values['hash0']}', '{$values['userid0']}', '', '{$values['public0']}', '{$values['title0']}', '{$values['desc0']}')";
	else
		$sql = "UPDATE lists SET public_id = '{$values['hash0']}', user_id = '{$values['userid0']}', password = '', public = '{$values['public0']}', name = '{$values['title0']}', description = '{$values['desc0']}' WHERE lists.id = {$values['id0']}";
	mysqli_query($link, $sql) or die(mysqli_error($link));
	if ($values['id0'] == -1)
		$id = mysqli_insert_id($link);
	else
		$id = $values['id0'];
	close_db($link);
	return $id;
}
function get_list_id($id){
	$link = connect_db();
	$sql = "SELECT * FROM lists WHERE lists.id = '$id' LIMIT 1";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	close_db($link);
	return mysqli_fetch_assoc($result);
}
function get_list_public($publicid){
	$link = connect_db();
	$sql = "SELECT * FROM lists WHERE lists.public_id = '$publicid' LIMIT 1";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	close_db($link);
	return mysqli_fetch_assoc($result);
}
function del_list($id){
	$link = connect_db();
	$sql = "DELETE FROM lists WHERE lists.id = '$id'";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	$sql = "DELETE FROM items WHERE items.list_id = '$id'";
	$result .= "\r\n".mysqli_query($link, $sql) or die(mysqli_error($link));
	close_db($link);
	return $result;
}
function get_alllists($userid){
	$link = connect_db();
	if($userid == -1)
		$sql = "SELECT * FROM lists WHERE public = 1";
	else
		$sql = "SELECT * FROM lists WHERE user_id = '$userid'";
	$result = mysqli_query($link, $sql);
	if (!$result){
	    return "Konnte Abfrage ($sql) nicht erfolgreich ausfuehren: " . mysqli_error($link);
	}elseif (mysqli_num_rows($result) == 0) {
	    return 1;
	}
	while(($lists[] = mysqli_fetch_assoc($result)) || array_pop($lists));
	close_db($link);
	return $lists;
}

/* ---------- Items ---------- */	
function set_item($values){
	$link = connect_db();
	if ($values['id0'] == -1)
		$sql = "INSERT INTO items (id, list_id, name, link, image) VALUES (NULL, '{$values['list0']}', '{$values['title0']}', '{$values['link0']}', '{$values['image0']}')";
	else
		$sql = "UPDATE items SET name = '{$values['title0']}', link = '{$values['link0']}', image = '{$values['image0']}' WHERE items.id = {$values['id0']}";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	if ($values['id0'] == -1)
		$id = mysqli_insert_id($link);
	else
		$id = $values['id0'];
	close_db($link);
	return $id;
}
function get_item($itemid){
	$link = connect_db();
	$sql = "SELECT * FROM items WHERE items.id = '$itemid' LIMIT 1";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	close_db($link);
	return mysqli_fetch_assoc($result);
}
function del_item($itemid){
	$link = connect_db();
	$sql = "DELETE FROM items WHERE items.id = '$itemid'";
	$result = mysqli_query($link, $sql) or die(mysqli_error($link));
	close_db($link);
	return $result;
}
function get_allitems($publicid){
	$link = connect_db();
	$sql = "SELECT items.*, lists.name as list_name, lists.user_id as userid FROM items, lists WHERE items.list_id = lists.id AND lists.public_id = '$publicid'";
	$result = mysqli_query($link, $sql);
	if (!$result){
	    return "Konnte Abfrage ($sql) nicht erfolgreich ausfuehren: " . mysqli_error($link);
	}elseif (mysqli_num_rows($result) == 0){
	    return 1;
	}
	while(($items[] = mysqli_fetch_assoc($result)) || array_pop($items));
	close_db($link);
	return $items;
}

/* ---------- AJAX request ---------- */
switch ($_POST["act"]){
	case 'gai':	//Get all items
		$publicid = urldecode($_POST["par"]);
		$result = get_list_public($publicid);
		$output = "<span class='listname' id='".$result["user_id"]."' style='display: none'>".$result["name"]."</span>\r\n";
		$result = get_allitems($publicid);
		if ($result != 1){
			$i = 1;
			$index = count($result);
			while($index--){
				$output .= '<div class="Item" id="item'.$result[$index]["id"].'" onmouseenter="SelItem(this, true)" onmouseleave="SelItem(this, false)">
						<div class="iEdit" onclick="EditItem(\''.$result[$index]["id"].'\')"><span>&#x2710;</span></div>						
						<a class="iLink" target="_blank" rel="noopener" href="//'.$result[$index]["link"].'"  title="'.htmlentities($result[$index]["name"]).'">
							<div class="iMain" style="background-image: url(\''.$result[$index]["image"].'\')"></div>
							<div class="iTitle">'.htmlentities($result[$index]["name"]).'</div>
						</a>
					</div>'."\r\n";
			}
		}
		echo $output;
		break;
		
	case 'gal':	//get all lists
		$userid = urldecode($_POST["par"]);
		$result = get_alllists($userid);
		if ($result != 1){
			$output = "\r\n";
			$index = count($result);
			while($index--){
				$items = get_allitems($result[$index]['public_id']);
				$image = $items[mt_rand(0, count($items) - 1)]['image'];
				$output .= '<div class="List" id="list'.$result[$index]["id"].'" onmouseenter="SelList(this, true)" onmouseleave="SelList(this, false)">
						<div class="lEdit" onclick="EditList(\''.$result[$index]["id"].'\')"><span>&#x2710;</span></div>
						<a class="lLink" target="_self" href="/?list='.$result[$index]["public_id"].'">
							<div class="lMain" style="background-image: url('.$image.')"></div>
							<div class="lTitle">'.htmlentities($result[$index]["name"]).'</div>
							<div class="lDesc">'.htmlentities($result[$index]["description"]).'</div>
						</a>
					</div>'."\r\n";
			}
			echo $output;
		}else
			echo '&nbsp;';
		break;
		
	case 'gl':
		$id = urldecode($_POST["par"]);
		$result = get_list_id($id);
		if ($result != 1)
			echo json_encode($result);
		else
			echo false;
		break;
	case 'gl_public':
		$publicid = urldecode($_POST["par"]);
		$result = get_list_public($publicid);
		if ($result != 1)
			echo json_encode($result);
		else
			echo false;
		break;
	case 'sl':
		parse_str(urldecode($_POST['par']), $values);
		echo set_list($values);
		break;
	case 'dl':
		$itemid = urldecode($_POST["par"]);
		if ($itemid != -1){
			$result = get_list_id($itemid);
			if (del_list($itemid)){
				echo true;
			}else
				echo false;
		}
		echo false;
		break;
		
	case 'gi':
		$itemid = urldecode($_POST["par"]);
		$result = get_item($itemid);
		if ($result != 1)
			echo json_encode($result);
		else
			echo false;
		break;
	case 'si':
		parse_str(urldecode($_POST['par']), $values);
		if ($values['list0'] != -1){
			$temp = get_list_public($values['list0']);
			$values['list0'] = $temp['id'];
			$values['link0'] = preg_replace('#^https?://#', '', rtrim($values['link0'],'/'));
			echo set_item($values);
		}
		else
			echo "List ID is incorrect: " . $values['list0'];
		break;
	case 'di':
		$itemid = urldecode($_POST["par"]);
		if ($itemid != -1){
			$result = get_item($itemid);
			$publicid = get_list_public($result['list_id']);
			if (del_item($itemid)){
				echo true;
			}else
				echo false;
		}
		echo false;
		break;
	case 'ogm':
		require_once('OpenGraph.php');
		$url = urldecode($_POST["par"]);
		$graph = OpenGraph::fetch($url);
		$result = object_to_array($graph);
		echo json_encode($result);
		break;
	case 'parser':
		$url = urldecode($_POST["par"]);
		if (!preg_match("~^(?:f|ht)tps?://~i", $url)) {
	        $url = "http://" . $url;
	    }
		$ch = curl_init();
	    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,120);
	    curl_setopt($ch, CURLOPT_TIMEOUT, 30); //timeout in seconds
	    curl_setopt($ch, CURLOPT_HEADER, 0);
	    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	    curl_setopt($ch, CURLOPT_URL, $url);
	    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
	    curl_setopt($ch, CURLOPT_USERAGENT, "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)");
	    curl_setopt($ch, CURLOPT_REFERER, 'http://google.com/search');
	    $data = curl_exec($ch);
	    curl_close($ch);
	    $result = array();
	    if(!empty($data)){
			$doc = new DOMDocument();
			@$doc->loadHTML($data);
			$tags = $doc->getElementsByTagName('img');
			if($tags || $tags->length !== 0){
				foreach ($tags AS $tag){
					if ($tag->hasAttribute('src'))
						if (filter_var($tag->getAttribute('src'), FILTER_VALIDATE_URL))
							if(!in_array($tag->getAttribute('src'), $result))
								$result[] = $tag->getAttribute('src');
				}
			}
	    }
	    if(count($result) == 0)
	    	$result = false;
	    echo json_encode($result);
		break;
}

function object_to_array($data){
    if(is_array($data) || is_object($data)){
        $result = array();
        foreach($data as $key => $value){
            $result[$key] = object_to_array($value);
        }
        return $result;
    }
    return $data;
}
?>
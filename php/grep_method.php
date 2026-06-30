<?php
const TAG_PATH = "../csv/tag.csv";
const GEOTAG_PATH = "../csv/geotag.csv";

function getImageIdsByTag($tag)
{
  $tagResult = array();

  # tagが含まれる行(形式は"画像ID,tag")を抽出するためのgrepコマンド
  $tagSearch = 'grep ",' . $tag . '$" ' . TAG_PATH;
  # grepの実行 $tagResultに実行結果がテキストで格納されている
  exec($tagSearch, $tagResult, $retVal);

  # grepの実行結果が正常でない場合にエラーを出す
  if ($retVal > 1) {
    throw new Exception($tag . "と紐づく画像ID抽出中に例外が発生しました");
  }
  if ($retVal === 1) {
    return array();
  }

  $image_id_list = array();

  foreach ($tagResult as $tagLine) {
    $data = str_getcsv($tagLine);

    if (count($data) < 2 || $data[1] !== $tag) {
      continue;
    }

    $image_id_list[$data[0]] = true;
  }

  return $image_id_list;
}

function getRequestTags()
{
  $tags = array();

  if (isset($_SERVER["QUERY_STRING"])) {
    $queryParams = explode("&", $_SERVER["QUERY_STRING"]);

    foreach ($queryParams as $queryParam) {
      $pair = explode("=", $queryParam, 2);
      $key = urldecode($pair[0]);

      if ($key === "tag" && isset($pair[1])) {
        array_push($tags, urldecode($pair[1]));
      }
    }
  }

  if (empty($tags) && isset($_REQUEST["tag"])) {
    if (is_array($_REQUEST["tag"])) {
      $tags = $_REQUEST["tag"];
    } else {
      $tags = array($_REQUEST["tag"]);
    }
  }

  return array_values(array_unique($tags));
}

function getGeotag($tags, $tagOperator, $sortOrder)
{

  $geotag_info_list = array();

  # ファイルが定位置にない時にエラーを出す
  if (!file_exists(TAG_PATH)) {
    throw new Exception("tag file not found");
  }
  if (!file_exists(GEOTAG_PATH)) {
    throw new Exception("geotag file not found");
  }

  if (empty($tags)) {
    return $geotag_info_list;
  }

  $image_id_list = array();
  $is_first_tag = true;

  foreach ($tags as $tag) {
    $tag_image_id_list = getImageIdsByTag($tag);

    if ($tagOperator === "and") {
      if ($is_first_tag) {
        $image_id_list = $tag_image_id_list;
      } else {
        $image_id_list = array_intersect_key($image_id_list, $tag_image_id_list);
      }
    } else {
      $image_id_list = $image_id_list + $tag_image_id_list;
    }

    $is_first_tag = false;
  }

  # 抽出してきた画像IDの情報をgeotag.csvから抽出する
  foreach (array_keys($image_id_list) as $image_id) {
    $geotagResult = array();

    # 画像IDを含む行を一件抽出してくるgrepコマンド
    $geotagSearch = "grep -m 1 " . $image_id . " " . GEOTAG_PATH;
    # grepコマンドの実行 $geotagResultに結果が格納されている
    exec($geotagSearch, $geotagResult, $retVal);

    # grepの実行結果が正常でない場合にエラーを出す
    if ($retVal !== 0) {
      throw new Exception("画像ID:" . $image_id . "の情報を取得中に例外が発生しました");
    }

    # 空白文字の削除
    # テキストをカンマ区切りで配列に変換する
    # 形式は"image_id,timestamp,lat,lon,url"
    $data = str_getcsv($geotagResult[0]);
    $timestamp = $data[1];
    $lat = floatval($data[2]);
    $lon = floatval($data[3]);
    $url = $data[4];

    # 辞書構造の作成
    $geotag_info = array("lat" => $lat, "lon" => $lon, "date" => $timestamp, "url" => $url);
    # 戻り値となる変数に結果を結合する
    array_push($geotag_info_list, $geotag_info);

  }

  usort($geotag_info_list, function ($left, $right) use ($sortOrder) {
    if ($left["date"] === $right["date"]) {
      return strcmp($left["url"], $right["url"]);
    }

    if ($sortOrder === "asc") {
      return strcmp($left["date"], $right["date"]);
    }

    return strcmp($right["date"], $left["date"]);
  });

  return array_slice($geotag_info_list, 0, 100);
}

function print_json($json)
{
  header("Content-Type: application/json; charset=utf-8");
  echo $json;
}

$tags = getRequestTags();
$tagOperator = isset($_REQUEST["tagOperator"]) && $_REQUEST["tagOperator"] === "and" ? "and" : "or";
$sortOrder = isset($_REQUEST["sortOrder"]) && $_REQUEST["sortOrder"] === "asc" ? "asc" : "desc";
$geotag_result = getGeotag($tags, $tagOperator, $sortOrder);
$response_dict = array("tag" => implode(",", $tags), "results" => $geotag_result);
$json = json_encode($response_dict);
print_json($json);

?>

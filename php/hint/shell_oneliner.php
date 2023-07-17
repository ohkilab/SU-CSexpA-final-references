<?php
const TAG_PATH = "../csv/tag_sort.csv";
const GEOTAG_PATH = "../csv/geotag_sort.csv";

function getGeotag($tag)
{

  $geotag_info_list = array();

  # ファイルが定位置にない時にエラーを出す
  if (!file_exists(TAG_PATH)) {
    throw new Exception("tag file not found");
  }
  if (!file_exists(GEOTAG_PATH)) {
    throw new Exception("geotag file not found");
  }

  $tagSearch = "awk -F',' -v tag=\"" . $tag . "\" '$2==tag{print $1}' " . TAG_PATH . ' | awk -F "," ' . "'FNR==NR{ids[$1];next} $1 in ids{count++; if(count==101){exit}; print}' - " . GEOTAG_PATH;

  # grepの実行 $tagResultに実行結果がテキストで格納されている
  $is_success = exec($tagSearch, $tagResult, $retVal);

  # grepの実行結果が正常でない場合にエラーを出す
  if (!$is_success) {
    throw new Exception($tag . "と紐づく画像ID抽出中に例外が発生しました");
  }

  foreach ($tagResult as $tr) {
    $data = explode(",", $tr, 5);
    $timestamp = str_replace("\"", "", $data[1]);
    $lat = floatval($data[2]);
    $lon = floatval($data[3]);
    $url = $data[4];

    # 辞書構造の作成
    $geotag_info = array("lat" => $lat, "lon" => $lon, "date" => $timestamp, "url" => $url);
    # 戻り値となる変数に結果を結合する
    array_push($geotag_info_list, $geotag_info);
  }

  return $geotag_info_list;
}

function print_json($json)
{
  header("Content-Type: application/json; charset=utf-8");
  echo $json;
}

$tag = $_REQUEST["tag"];
$cachedData = apcu_fetch($tag);
if ($cachedData !== false) {
  print_json($cachedData);
} else {
  $geotag_result = getGeotag($tag);
  $responce_dict = array("tag" => $tag, "results" => $geotag_result);
  $json = json_encode($responce_dict);
  print_json($json);

  $ttl = 300;
  apcu_store($tag, $json, $ttl);
}

?>


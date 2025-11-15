import { getDb } from "./db/client";
import { CORS } from "./utils/response";
import { handleSearch } from "./handlers/search";
import { handleShop } from "./handlers/shop";
import { handleAreas } from "./handlers/areas";
import { handleAreaCounts } from "./handlers/areaCounts";
import { handleAreasTree } from "./handlers/areasTree";

/**
 * API エントリポイント。
 * URL パスと HTTP メソッドに応じて各ハンドラーへ処理を委譲する。
 */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS プリフライト (OPTIONS) はアプリケーションロジックを通さず、
    // 共通 CORS ヘッダーのみを付与して 204 で応答する。
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // 以降のハンドラーで共有する D1 接続を初期化。
    const db = getDb(env);

    // GET /search:
    // クエリパラメータを基に店舗検索を行い、一覧を返却する。
    if (url.pathname === "/search" && req.method === "GET") {
      return handleSearch(req, env, db);
    }

    // GET /shop:
    // クエリ文字列の id をキーに、単一店舗の詳細情報を取得する。
    if (url.pathname === "/shop" && req.method === "GET") {
      return handleShop(req, env, db);
    }

    // GET /areas:
    // 中エリア・小エリアのコードおよび名称をフラットな一覧として返却する。
    if (url.pathname === "/areas" && req.method === "GET") {
      return handleAreas(req, env, db);
    }

    // GET /area_counts:
    // 検索条件にマッチする店舗件数をエリア単位で集計して返却する。
    if (url.pathname === "/area_counts" && req.method === "GET") {
      return handleAreaCounts(req, env, db);
    }

    // GET /areas_tree:
    // 中エリアを親、小エリアを子とするツリー構造を返却する。
    if (url.pathname === "/areas_tree" && req.method === "GET") {
      return handleAreasTree(req, env, db);
    }

    // 未定義パスへのフォールバック応答。
    // 監視や疎通確認用に 200 を返しつつ、利用可能な代表エンドポイントを案内する。
    return new Response(
      "OK (try GET /search, /areas, /area_counts, or /areas_tree)",
      { status: 200, headers: CORS },
    );
  },
};

import { getDb } from "./db/client";
import { CORS } from "./utils/response";
import { handleSearch } from "./handlers/search";
import { handleShop } from "./handlers/shop";
import { handleAreas } from "./handlers/areas";
import { handleAreaCounts } from "./handlers/areaCounts";
import { handleAreasTree } from "./handlers/areasTree";
import { handleRecommend } from "./handlers/recommend";

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

    // GET エンドポイント群をマッピング。フローを簡潔に保つ。
    const getHandlers = {
      "/search": handleSearch,
      "/shop": handleShop,
      "/areas": handleAreas,
      "/area_counts": handleAreaCounts,
      "/areas_tree": handleAreasTree,
      "/recommend": handleRecommend,
    };
    const handler = req.method === "GET" ? getHandlers[url.pathname] : undefined;
    if (handler) {
      return handler(req, env, db);
    }

    // 未定義パスへのフォールバック応答。
    // 監視や疎通確認用に 200 を返しつつ、利用可能な代表エンドポイントを案内する。
    return new Response(
      "OK (try GET /search, /shop, /areas, /area_counts, /areas_tree, or /recommend)",
      { status: 200, headers: CORS },
    );
  },
};

defmodule ApiWeb.RegionChannelTest do
  use ApiWeb.ChannelCase

  alias ApiWeb.RegionChannel

  import Api.AccountsFixtures
  import Api.CanvasFixtures

  setup do
    user = user_fixture()
    token = Phoenix.Token.sign(ApiWeb.Endpoint, "pixel socket", user.id)
    {:ok, socket} = connect(ApiWeb.CanvasSocket, %{"token" => token})
    {:ok, _, socket} = subscribe_and_join(socket, RegionChannel, "region:general")
    {:ok, socket: socket, user: user}
  end

  describe "chunk subscription" do
    test "subscribe_chunks adds chunks to subscribed set", %{socket: socket} do
      chunk_keys = ["x: 0 y: 0", "x: 400 y: 0"]

      ref = push(socket, "subscribe_chunks", %{"chunk_keys" => chunk_keys})

      assert_reply ref, :ok, %{subscribed: ^chunk_keys}
    end

    test "unsubscribe_chunks removes chunks from subscribed set", %{socket: socket} do
      # First subscribe
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0", "x: 400 y: 0"]})

      # Then unsubscribe from one
      ref = push(socket, "unsubscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      assert_reply ref, :ok, %{unsubscribed: ["x: 0 y: 0"]}
    end

    test "multiple subscriptions are additive", %{socket: socket} do
      ref1 = push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})
      assert_reply ref1, :ok, %{subscribed: ["x: 0 y: 0"]}

      ref2 = push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 400 y: 0"]})
      assert_reply ref2, :ok, %{subscribed: ["x: 400 y: 0"]}
    end
  end

  describe "filtered broadcasts for plot events" do
    test "create_plot is only sent to clients subscribed to relevant chunks", %{socket: socket, user: user} do
      # Subscribe to chunk x: 0 y: 0
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      # Create another socket that's NOT subscribed to this chunk
      {:ok, other_socket} = connect(ApiWeb.CanvasSocket, %{})
      {:ok, _, other_socket} = subscribe_and_join(other_socket, RegionChannel, "region:general")
      push(other_socket, "subscribe_chunks", %{"chunk_keys" => ["x: 400 y: 400"]})

      plot = plot_fixture(%{user_id: user.id})
      chunk_keys = ["x: 0 y: 0"]

      # Broadcast the plot event
      ApiWeb.Endpoint.broadcast("region:general", "create_plot", %{
        "plot" => plot,
        "chunk_keys" => chunk_keys
      })

      # Subscribed socket should receive the event
      assert_push "create_plot", %{"plot" => _received_plot, "chunk_keys" => received_chunk_keys}
      assert received_chunk_keys == chunk_keys

      # Other socket should NOT receive the event (no push within timeout)
      refute_push "create_plot", _, 100
    end

    test "update_plot is only sent to clients subscribed to relevant chunks", %{socket: socket, user: user} do
      # Subscribe to chunk
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      plot = plot_fixture(%{user_id: user.id})
      chunk_keys = ["x: 0 y: 0"]

      ApiWeb.Endpoint.broadcast("region:general", "update_plot", %{
        "plot" => plot,
        "chunk_keys" => chunk_keys
      })

      assert_push "update_plot", %{"plot" => _received_plot, "chunk_keys" => ^chunk_keys}
    end

    test "delete_plot is only sent to clients subscribed to relevant chunks", %{socket: socket} do
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      plot_id = 123
      chunk_keys = ["x: 0 y: 0"]

      ApiWeb.Endpoint.broadcast("region:general", "delete_plot", %{
        "plot_id" => plot_id,
        "chunk_keys" => chunk_keys
      })

      assert_push "delete_plot", %{"plot_id" => ^plot_id, "chunk_keys" => ^chunk_keys}
    end

    test "plot event is not sent if client is not subscribed to any relevant chunks", %{socket: socket, user: user} do
      # Subscribe to a different chunk
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 800 y: 800"]})

      plot = plot_fixture(%{user_id: user.id})
      chunk_keys = ["x: 0 y: 0"]

      ApiWeb.Endpoint.broadcast("region:general", "create_plot", %{
        "plot" => plot,
        "chunk_keys" => chunk_keys
      })

      # Should not receive the event
      refute_push "create_plot", _, 100
    end

    test "plot event includes only the chunk_keys the client is subscribed to", %{socket: socket, user: user} do
      # Subscribe to only one of the chunks
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      plot = plot_fixture(%{user_id: user.id})
      # Plot spans multiple chunks
      chunk_keys = ["x: 0 y: 0", "x: 400 y: 0", "x: 0 y: 400"]

      ApiWeb.Endpoint.broadcast("region:general", "create_plot", %{
        "plot" => plot,
        "chunk_keys" => chunk_keys
      })

      # Should receive only the subscribed chunk key
      assert_push "create_plot", %{"plot" => _received_plot, "chunk_keys" => received_chunk_keys}
      assert received_chunk_keys == ["x: 0 y: 0"]
    end
  end

  describe "filtered broadcasts for new_pixels" do
    test "new_pixels is only sent to clients subscribed to relevant chunks", %{socket: socket, user: user} do
      # Subscribe to chunk x: 0 y: 0 (pixels at coordinates 0-399)
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      # Create another socket subscribed to a different chunk
      {:ok, other_socket} = connect(ApiWeb.CanvasSocket, %{})
      {:ok, _, other_socket} = subscribe_and_join(other_socket, RegionChannel, "region:general")
      push(other_socket, "subscribe_chunks", %{"chunk_keys" => ["x: 400 y: 400"]})

      # Create a plot in the subscribed chunk
      _plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{5, 15}, {5, 25}, {15, 25}, {15, 15}, {5, 15}]],
            srid: 4326
          }
        })

      pixels = [%{"x" => 10, "y" => 20, "color_ref" => 1}]
      store_id = "test_store"

      push(socket, "new_pixels", %{
        "pixels" => pixels,
        "store_id" => store_id
      })

      # The subscribed socket receives the broadcast
      assert_broadcast "new_pixels", %{pixels: _, store_id: ^store_id}
    end

    test "new_pixels filters pixels based on subscribed chunks", %{socket: socket, user: user} do
      # Subscribe to only chunk x: 0 y: 0
      push(socket, "subscribe_chunks", %{"chunk_keys" => ["x: 0 y: 0"]})

      # Create plots in both chunks
      _plot1 =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{5, 5}, {5, 25}, {25, 25}, {25, 5}, {5, 5}]],
            srid: 4326
          }
        })

      _plot2 =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{405, 405}, {405, 425}, {425, 425}, {425, 405}, {405, 405}]],
            srid: 4326
          }
        })

      # Pixels in both chunks
      pixels = [
        %{"x" => 10, "y" => 10, "color_ref" => 1},
        %{"x" => 410, "y" => 410, "color_ref" => 2}
      ]
      store_id = "test_store"

      push(socket, "new_pixels", %{
        "pixels" => pixels,
        "store_id" => store_id
      })

      # This will broadcast all pixels, but handle_out will filter
      assert_broadcast "new_pixels", %{pixels: _, store_id: ^store_id}

      # The push to our socket should only include pixels from x: 0 y: 0 chunk
      assert_push "new_pixels", %{pixels: filtered_pixels, store_id: ^store_id}
      assert length(filtered_pixels) == 1
      assert Enum.at(filtered_pixels, 0)["x"] == 10
    end
  end

  describe "handle_in/3 for new_pixels" do
    test "processes valid pixels and broadcasts to other clients", %{socket: socket, user: user} do
      # Create a plot that covers the pixel coordinates
      _plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{5, 15}, {5, 25}, {15, 25}, {15, 15}, {5, 15}]],
            srid: 4326
          }
        })

      pixels = [%{"x" => 10, "y" => 20, "color_ref" => 1}]
      store_id = "test_store"

      push(socket, "new_pixels", %{
        "pixels" => pixels,
        "store_id" => store_id
      })

      # Should broadcast to other clients
      assert_broadcast "new_pixels", %{pixels: _, store_id: ^store_id}
    end

    test "allows unauthenticated users to draw outside plots and broadcasts", %{socket: _socket} do
      # Create a socket without user_id
      {:ok, unauth_socket} = connect(ApiWeb.CanvasSocket, %{})
      {:ok, _, unauth_socket} = subscribe_and_join(unauth_socket, RegionChannel, "region:general")

      pixels = [%{"x" => 10, "y" => 20, "color_ref" => 1}]
      store_id = "test_store"

      push(unauth_socket, "new_pixels", %{
        "pixels" => pixels,
        "store_id" => store_id
      })

      assert_broadcast "new_pixels", %{pixels: _any, store_id: ^store_id}
    end
  end
end

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

  describe "handle_info/2 for plot events" do
    test "forwards create_plot broadcast to clients", %{socket: socket, user: user} do
      plot = plot_fixture(%{user_id: user.id})

      # Send the broadcast message directly to the channel process
      send(socket.channel_pid, %Phoenix.Socket.Broadcast{
        topic: "region:general",
        event: "create_plot",
        payload: %{"plot" => plot}
      })

      # Assert the client receives the pushed message
      assert_push "create_plot", %{"plot" => received_plot}
      assert received_plot == plot
    end

    test "forwards update_plot broadcast to clients", %{socket: socket, user: user} do
      plot = plot_fixture(%{user_id: user.id})

      # Send the broadcast message directly to the channel process
      send(socket.channel_pid, %Phoenix.Socket.Broadcast{
        topic: "region:general",
        event: "update_plot",
        payload: %{"plot" => plot}
      })

      # Assert the client receives the pushed message
      assert_push "update_plot", %{"plot" => received_plot}
      assert received_plot == plot
    end

    test "forwards delete_plot broadcast to clients", %{socket: socket} do
      plot_id = 123

      # Send the broadcast message directly to the channel process
      send(socket.channel_pid, %Phoenix.Socket.Broadcast{
        topic: "region:general",
        event: "delete_plot",
        payload: %{"plot_id" => plot_id}
      })

      # Assert the client receives the pushed message
      assert_push "delete_plot", %{"plot_id" => received_plot_id}
      assert received_plot_id == plot_id
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

      pixels = [%{"x" => 10, "y" => 20, "color" => 1}]
      store_id = "test_store"

      push(socket, "new_pixels", %{
        "pixels" => pixels,
        "store_id" => store_id
      })

      # Should broadcast to other clients
      assert_broadcast "new_pixels", %{pixels: _, store_id: ^store_id}
    end

    test "rejects pixels when user is not authenticated", %{socket: _socket} do
      # Create a socket without user_id
      {:ok, unauth_socket} = connect(ApiWeb.CanvasSocket, %{})
      {:ok, _, unauth_socket} = subscribe_and_join(unauth_socket, RegionChannel, "region:general")

      pixels = [%{"x" => 10, "y" => 20, "color" => 1}]
      store_id = "test_store"

      ref =
        push(unauth_socket, "new_pixels", %{
          "pixels" => pixels,
          "store_id" => store_id
        })

      assert_reply ref, :error, "unauthed_user"
    end
  end
end
